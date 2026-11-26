using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PawrtalWeb.Shared;
using PawrtalWeb.Models;

namespace PawtralWeb.Services
{
    public class NotificationService
    {
        private readonly PawrtalDbContext _db;
        private readonly ISmsService _sms;
        private readonly IEmailService _email;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(PawrtalDbContext db, ISmsService sms, IEmailService email, ILogger<NotificationService> logger)
        {
            _db = db;
            _sms = sms;
            _email = email;
            _logger = logger;
        }

        public async Task CreateNotificationAsync(string? email, string type, string title, string message, string? prefKey = null)
        {
            if (string.IsNullOrWhiteSpace(email)) return;

            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null) return;

            bool smsOptedOut = false;
            bool emailOptedOut = false;

            if (!string.IsNullOrEmpty(prefKey) && !string.IsNullOrWhiteSpace(user.NotificationPrefsJson))
            {
                try
                {
                    var prefs = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(user.NotificationPrefsJson);
                    if (prefs != null)
                    {
                        if (prefs.TryGetValue(prefKey, out var el) && el.ValueKind == JsonValueKind.False)
                        {
                            return; // User opted out of this notification category
                        }
                        if (prefs.TryGetValue("sms", out var smsEl) && smsEl.ValueKind == JsonValueKind.False)
                        {
                            smsOptedOut = true;
                        }
                        if (prefs.TryGetValue("email", out var emailEl) && emailEl.ValueKind == JsonValueKind.False)
                        {
                            emailOptedOut = true;
                        }
                    }
                }
                catch { }
            }

            if (!string.IsNullOrEmpty(message))
            {
                message = System.Text.RegularExpressions.Regex.Replace(message, @"(?i)\b(dr\.?\s*){2,}", "Dr. ");
            }

            _db.Notifications.Add(new Notification
            {
                Id = Guid.NewGuid(),
                UserEmail = email,
                Type = type,
                Title = title,
                Message = message,
                CreatedAt = DateTime.UtcNow
            });

            await _db.SaveChangesAsync();

            // Asynchronously dispatch SMS if user has a phone number and hasn't opted out
            if (!smsOptedOut && !string.IsNullOrWhiteSpace(user.Phone))
            {
                var phone = user.Phone;
                var cleanTitle = (title ?? "").Trim().TrimEnd(':');
                var smsText = $"Pawrtal: {cleanTitle}: {message}";
                if (smsText.Length > 160)
                {
                    smsText = smsText.Substring(0, 157) + "...";
                }

                _ = Task.Run(async () =>
                {
                    try
                    {
                        await _sms.SendSmsAsync(phone, smsText);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed background SMS dispatch for {Email} ({Phone})", email, phone);
                    }
                });
            }

            // Asynchronously dispatch Email if user has an email and hasn't opted out
            if (!emailOptedOut && !string.IsNullOrWhiteSpace(user.Email) && user.Email.Contains("@"))
            {
                var targetEmail = user.Email;
                var targetName = user.FullName ?? user.DisplayName ?? "Pet Parent";
                var cleanTitle = (title ?? "").Trim().TrimEnd(':');
                var subject = $"🐾 {cleanTitle} - VM Veterinary Clinic";
                var htmlBody = $@"
<!DOCTYPE html>
<html>
<head>
  <meta charset='utf-8'>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }}
    .container {{ max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }}
    .header {{ background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: #ffffff; padding: 28px 24px; text-align: center; }}
    .header h1 {{ margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }}
    .header p {{ margin: 6px 0 0; font-size: 13px; opacity: 0.9; }}
    .content {{ padding: 28px 24px; }}
    .msg-box {{ background: #f0fdfa; border-left: 4px solid #0d9488; padding: 16px; border-radius: 8px; font-size: 15px; line-height: 1.6; color: #334155; margin: 16px 0; }}
    .footer {{ background: #f8fafc; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }}
  </style>
</head>
<body>
  <div class='container'>
    <div class='header'>
      <h1>VM VETERINARY CLINIC</h1>
      <p>PAWRTAL Pet Healthcare Portal</p>
    </div>
    <div class='content'>
      <p style='font-size: 15px; margin-top: 0;'>Hello <strong>{System.Net.WebUtility.HtmlEncode(targetName)}</strong>,</p>
      <div class='msg-box'>
        <strong style='color: #0f766e; display: block; margin-bottom: 6px;'>{System.Net.WebUtility.HtmlEncode(cleanTitle)}</strong>
        {System.Net.WebUtility.HtmlEncode(message)}
      </div>
      <p style='font-size: 13px; color: #64748b; margin-top: 20px;'>
        You can log in to your PAWRTAL account anytime to view appointment updates, queue tickets, health records, and medical details.
      </p>
    </div>
    <div class='footer'>
      <p style='margin: 0;'>VM Veterinary Clinic • Caring for your pets like family</p>
      <p style='margin: 4px 0 0;'>This is an automated notification from your PAWRTAL clinic system.</p>
    </div>
  </div>
</body>
</html>";

                _ = Task.Run(async () =>
                {
                    try
                    {
                        await _email.SendEmailAsync(targetEmail, subject, htmlBody, message);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed background Email dispatch for {Email}", targetEmail);
                    }
                });
            }
        }

        public void SendAppointmentConfirmationEmail(string email, string ownerName, string petName, string date, string time, string reason, string vetName)
        {
            if (string.IsNullOrWhiteSpace(email) || !email.Contains("@")) return;
            _ = Task.Run(async () =>
            {
                try
                {
                    await _email.SendAppointmentConfirmationAsync(email, ownerName, petName, date, time, reason, vetName);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed appointment confirmation email to {Email}", email);
                }
            });
        }

        public void SendQueueTicketAlertEmail(string email, string ownerName, string petName, string ticketNumber, string statusMessage)
        {
            if (string.IsNullOrWhiteSpace(email) || !email.Contains("@")) return;
            _ = Task.Run(async () =>
            {
                try
                {
                    await _email.SendQueueTicketAlertAsync(email, ownerName, petName, ticketNumber, statusMessage);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed queue ticket alert email to {Email}", email);
                }
            });
        }

        public void SendClinicalVisitSummaryEmail(string email, string ownerName, string petName, string date, string vetName, string diagnosis, string treatment, string? weight = null, string? temperature = null)
        {
            if (string.IsNullOrWhiteSpace(email) || !email.Contains("@")) return;
            _ = Task.Run(async () =>
            {
                try
                {
                    await _email.SendClinicalVisitSummaryAsync(email, ownerName, petName, date, vetName, diagnosis, treatment, weight, temperature);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed clinical visit summary email to {Email}", email);
                }
            });
        }

        public async Task NotifyAdminsAsync(string type, string title, string message, string? prefKey = null)
        {
            var admins = await _db.Users
                .AsNoTracking()
                .Where(u => !u.IsDeleted && u.UserType == "admin")
                .ToListAsync();

            foreach (var admin in admins)
            {
                await CreateNotificationAsync(admin.Email, type, title, message, prefKey);
            }
        }
    }
}


