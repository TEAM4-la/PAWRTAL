using System.Net;
using System.Net.Mail;
using System.Text;

namespace PawtralWeb.Services
{
    public class GmailSmtpEmailService : IEmailService
    {
        private readonly IConfiguration _config;
        private readonly ILogger<GmailSmtpEmailService> _logger;

        public GmailSmtpEmailService(IConfiguration config, ILogger<GmailSmtpEmailService> logger)
        {
            _config = config;
            _logger = logger;
        }

        public async Task<bool> SendEmailAsync(string toEmail, string subject, string htmlBody, string? textBody = null)
        {
            if (string.IsNullOrWhiteSpace(toEmail))
            {
                _logger.LogWarning("Email sending skipped: recipient email is empty.");
                return false;
            }

            var enabled = _config.GetValue<bool>("SmtpSettings:Enabled", true);
            if (!enabled)
            {
                _logger.LogInformation("SMTP dispatch skipped: SmtpSettings:Enabled is false.");
                return false;
            }

            var host = _config["SmtpSettings:Host"] ?? "smtp.gmail.com";
            var port = _config.GetValue<int>("SmtpSettings:Port", 587);
            var senderEmail = _config["SmtpSettings:SenderEmail"] ?? "pawrtal.vmclinic@gmail.com";
            var senderName = _config["SmtpSettings:SenderName"] ?? "PAWRTAL - VM Veterinary Clinic";
            var rawPassword = _config["SmtpSettings:AppPassword"] ?? "";
            var appPassword = rawPassword.Replace(" ", "").Trim();

            if (string.IsNullOrWhiteSpace(appPassword))
            {
                _logger.LogWarning("Email sending failed: SmtpSettings:AppPassword is empty.");
                return false;
            }

            try
            {
                using var client = new SmtpClient(host, port)
                {
                    EnableSsl = true,
                    UseDefaultCredentials = false,
                    Credentials = new NetworkCredential(senderEmail, appPassword),
                    DeliveryMethod = SmtpDeliveryMethod.Network,
                    Timeout = 15000 // 15 seconds
                };

                using var mailMessage = new MailMessage
                {
                    From = new MailAddress(senderEmail, senderName),
                    Subject = subject,
                    Body = htmlBody,
                    IsBodyHtml = true,
                    BodyEncoding = Encoding.UTF8,
                    SubjectEncoding = Encoding.UTF8
                };

                mailMessage.To.Add(toEmail.Trim());

                await client.SendMailAsync(mailMessage);
                _logger.LogInformation("Email successfully dispatched to {Recipient} with subject: {Subject}", toEmail, subject);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email to {Recipient} via Gmail SMTP: {Message}", toEmail, ex.Message);
                return false;
            }
        }

        public async Task<bool> SendAppointmentConfirmationAsync(string toEmail, string ownerName, string petName, string date, string time, string reason, string vetName)
        {
            var subject = $"🐾 Appointment Confirmed for {petName} - VM Veterinary Clinic";
            var html = $@"
<!DOCTYPE html>
<html>
<head>
  <meta charset='utf-8'>
  <meta name='viewport' content='width=device-width, initial-scale=1.0'>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }}
    .container {{ max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }}
    .header {{ background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: #ffffff; padding: 32px 28px; text-align: center; }}
    .header h1 {{ margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }}
    .header p {{ margin: 8px 0 0; font-size: 14px; opacity: 0.9; }}
    .content {{ padding: 28px; }}
    .badge {{ display: inline-block; padding: 6px 14px; border-radius: 9999px; font-size: 12px; font-weight: 600; background-color: #ccfbf1; color: #0f766e; text-transform: uppercase; margin-bottom: 16px; }}
    .card {{ background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 12px; padding: 18px; margin: 18px 0; }}
    .row {{ display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #cbd5e1; font-size: 14px; }}
    .row:last-child {{ border-bottom: none; }}
    .label {{ color: #64748b; font-weight: 500; }}
    .value {{ color: #0f172a; font-weight: 600; text-align: right; }}
    .tip {{ background: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px; border-radius: 6px; font-size: 13px; color: #92400e; margin-top: 20px; }}
    .footer {{ background: #f8fafc; padding: 20px 28px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }}
  </style>
</head>
<body>
  <div class='container'>
    <div class='header'>
      <h1>VM VETERINARY CLINIC</h1>
      <p>Powered by PAWRTAL Pet Healthcare</p>
    </div>
    <div class='content'>
      <div class='badge'>Appointment Confirmed</div>
      <p style='font-size: 16px; margin-top: 0;'>Hello <strong>{WebUtility.HtmlEncode(ownerName)}</strong>,</p>
      <p style='font-size: 14px; line-height: 1.6; color: #475569;'>
        Your veterinary appointment for <strong>{WebUtility.HtmlEncode(petName)}</strong> has been confirmed. Below are your appointment details:
      </p>

      <div class='card'>
        <table style='width: 100%; border-collapse: collapse;'>
          <tr>
            <td style='padding: 6px 0; color: #64748b; font-size: 14px;'>Patient</td>
            <td style='padding: 6px 0; color: #0f172a; font-weight: 600; font-size: 14px; text-align: right;'>{WebUtility.HtmlEncode(petName)}</td>
          </tr>
          <tr>
            <td style='padding: 6px 0; color: #64748b; font-size: 14px;'>Date</td>
            <td style='padding: 6px 0; color: #0f172a; font-weight: 600; font-size: 14px; text-align: right;'>{WebUtility.HtmlEncode(date)}</td>
          </tr>
          <tr>
            <td style='padding: 6px 0; color: #64748b; font-size: 14px;'>Scheduled Time</td>
            <td style='padding: 6px 0; color: #0f766e; font-weight: 700; font-size: 14px; text-align: right;'>{WebUtility.HtmlEncode(time)}</td>
          </tr>
          <tr>
            <td style='padding: 6px 0; color: #64748b; font-size: 14px;'>Reason for Visit</td>
            <td style='padding: 6px 0; color: #0f172a; font-weight: 600; font-size: 14px; text-align: right;'>{WebUtility.HtmlEncode(reason)}</td>
          </tr>
          <tr>
            <td style='padding: 6px 0; color: #64748b; font-size: 14px;'>Attending Veterinarian</td>
            <td style='padding: 6px 0; color: #0f172a; font-weight: 600; font-size: 14px; text-align: right;'>{WebUtility.HtmlEncode(vetName)}</td>
          </tr>
        </table>
      </div>

      <div class='tip'>
        <strong>Clinic Arrival Tip:</strong> Please arrive 10 minutes early so our front desk can check in {WebUtility.HtmlEncode(petName)} and issue your live queue ticket.
      </div>
    </div>
    <div class='footer'>
      <p style='margin: 0;'>VM Veterinary Clinic • Caring for your pets like family</p>
      <p style='margin: 4px 0 0;'>This is an automated notification from your PAWRTAL clinic system.</p>
    </div>
  </div>
</body>
</html>";

            return await SendEmailAsync(toEmail, subject, html);
        }

        public async Task<bool> SendQueueTicketAlertAsync(string toEmail, string ownerName, string petName, string ticketNumber, string statusMessage)
        {
            var subject = $"🔔 Ticket #{ticketNumber} is Called! - VM Veterinary Clinic";
            var html = $@"
<!DOCTYPE html>
<html>
<head>
  <meta charset='utf-8'>
  <meta name='viewport' content='width=device-width, initial-scale=1.0'>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }}
    .container {{ max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }}
    .header {{ background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #ffffff; padding: 30px 24px; text-align: center; }}
    .content {{ padding: 28px; text-align: center; }}
    .ticket-box {{ background: #ecfdf5; border: 2px dashed #059669; border-radius: 16px; padding: 24px; margin: 20px 0; display: inline-block; min-width: 220px; }}
    .ticket-label {{ font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #047857; font-weight: 600; margin: 0; }}
    .ticket-num {{ font-size: 42px; font-weight: 800; color: #065f46; margin: 8px 0; }}
    .footer {{ background: #f8fafc; padding: 18px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }}
  </style>
</head>
<body>
  <div class='container'>
    <div class='header'>
      <h1 style='margin: 0; font-size: 22px;'>YOUR TICKET HAS BEEN CALLED!</h1>
    </div>
    <div class='content'>
      <p style='font-size: 16px; margin-top: 0;'>Hello <strong>{WebUtility.HtmlEncode(ownerName)}</strong>,</p>
      
      <div class='ticket-box'>
        <p class='ticket-label'>Live Queue Number</p>
        <p class='ticket-num'>#{WebUtility.HtmlEncode(ticketNumber)}</p>
        <p style='margin: 0; font-size: 14px; font-weight: 600; color: #047857;'>Patient: {WebUtility.HtmlEncode(petName)}</p>
      </div>

      <p style='font-size: 15px; color: #334155; line-height: 1.6; margin: 16px 0 0;'>
        {WebUtility.HtmlEncode(statusMessage)}
      </p>
      <p style='font-size: 13px; color: #64748b; margin-top: 8px;'>
        Please proceed with <strong>{WebUtility.HtmlEncode(petName)}</strong> to the consultation room now.
      </p>
    </div>
    <div class='footer'>
      <p style='margin: 0;'>VM Veterinary Clinic • Real-Time Queue Tracker</p>
    </div>
  </div>
</body>
</html>";

            return await SendEmailAsync(toEmail, subject, html);
        }

        public async Task<bool> SendClinicalVisitSummaryAsync(string toEmail, string ownerName, string petName, string date, string vetName, string diagnosis, string treatment, string? weight = null, string? temperature = null)
        {
            var subject = $"🩺 Consultation & Medical Summary for {petName} - {date}";
            var vitalsRows = "";
            if (!string.IsNullOrWhiteSpace(weight))
            {
                vitalsRows += $"<tr><td style='padding: 4px 0; color: #64748b;'>Recorded Weight:</td><td style='padding: 4px 0; color: #0f172a; font-weight: 600; text-align: right;'>{WebUtility.HtmlEncode(weight)} kg</td></tr>";
            }
            if (!string.IsNullOrWhiteSpace(temperature))
            {
                vitalsRows += $"<tr><td style='padding: 4px 0; color: #64748b;'>Body Temperature:</td><td style='padding: 4px 0; color: #0f172a; font-weight: 600; text-align: right;'>{WebUtility.HtmlEncode(temperature)} °C</td></tr>";
            }

            var html = $@"
<!DOCTYPE html>
<html>
<head>
  <meta charset='utf-8'>
  <meta name='viewport' content='width=device-width, initial-scale=1.0'>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }}
    .container {{ max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }}
    .header {{ background: linear-gradient(135deg, #0d9488 0%, #115e59 100%); color: #ffffff; padding: 28px; text-align: center; }}
    .content {{ padding: 28px; }}
    .section-title {{ font-size: 13px; font-weight: 700; text-transform: uppercase; color: #0f766e; letter-spacing: 0.5px; margin: 20px 0 8px; border-bottom: 2px solid #ccfbf1; padding-bottom: 4px; }}
    .box {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; font-size: 14px; line-height: 1.6; color: #334155; white-space: pre-wrap; }}
    .footer {{ background: #f8fafc; padding: 18px 28px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }}
  </style>
</head>
<body>
  <div class='container'>
    <div class='header'>
      <h1 style='margin: 0; font-size: 22px;'>CLINICAL VISIT SUMMARY</h1>
      <p style='margin: 6px 0 0; font-size: 13px; opacity: 0.9;'>VM Veterinary Clinic • Attending: {WebUtility.HtmlEncode(vetName)}</p>
    </div>
    <div class='content'>
      <p style='font-size: 15px; margin-top: 0;'>Dear <strong>{WebUtility.HtmlEncode(ownerName)}</strong>,</p>
      <p style='font-size: 14px; color: #475569; line-height: 1.5;'>
        Thank you for visiting VM Veterinary Clinic with <strong>{WebUtility.HtmlEncode(petName)}</strong> on {WebUtility.HtmlEncode(date)}. Below is the summary of your consultation and care plan:
      </p>

      {(string.IsNullOrEmpty(vitalsRows) ? "" : $@"
      <div style='background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 10px; padding: 12px 16px; margin: 16px 0;'>
        <table style='width: 100%; font-size: 13px;'>{vitalsRows}</table>
      </div>")}

      <div class='section-title'>Assessment & Diagnosis Findings</div>
      <div class='box'>{WebUtility.HtmlEncode(diagnosis)}</div>

      <div class='section-title'>Treatment & Recommendations</div>
      <div class='box'>{WebUtility.HtmlEncode(treatment)}</div>

      <p style='font-size: 13px; color: #64748b; margin-top: 24px; line-height: 1.5;'>
        You can also view your pet's complete medical history, vaccination records, and follow-up schedules anytime on your PAWRTAL dashboard.
      </p>
    </div>
    <div class='footer'>
      <p style='margin: 0;'>VM Veterinary Clinic • We wish {WebUtility.HtmlEncode(petName)} a speedy and healthy recovery!</p>
    </div>
  </div>
</body>
</html>";

            return await SendEmailAsync(toEmail, subject, html);
        }
    }
}
