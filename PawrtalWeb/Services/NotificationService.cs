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
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(PawrtalDbContext db, ISmsService sms, ILogger<NotificationService> logger)
        {
            _db = db;
            _sms = sms;
            _logger = logger;
        }

        public async Task CreateNotificationAsync(string? email, string type, string title, string message, string? prefKey = null)
        {
            if (string.IsNullOrWhiteSpace(email)) return;

            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null) return;

            bool smsOptedOut = false;

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
                    }
                }
                catch { }
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
                var smsText = $"Pawrtal: {title} - {message}";
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
        }
    }
}


