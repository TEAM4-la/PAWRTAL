using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pawtral.Web.Controllers.Api.Dtos;
using PawrtalWeb.Shared;
using PawrtalWeb.Models;

namespace Pawtral.Web.Controllers.Api;

[ApiController]
[Route("api/notifications")]
public class NotificationsController : ControllerBase
{
    private readonly PawrtalDbContext _db;

    public NotificationsController(PawrtalDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<NotificationDto>>> Filter(
        [FromQuery(Name = "user_email")] string? userEmail,
        [FromQuery] string? order,
        [FromQuery] int limit = 30)
    {
        if (string.IsNullOrWhiteSpace(userEmail))
            return Ok(new List<NotificationDto>());

        IQueryable<Notification> q = _db.Notifications.AsNoTracking().Where(n => n.UserEmail == userEmail);

        q = order switch
        {
            "-created_date" => q.OrderByDescending(n => n.CreatedAt),
            "created_date" => q.OrderBy(n => n.CreatedAt),
            _ => q.OrderByDescending(n => n.CreatedAt)
        };

        var rows = await q.Take(Math.Clamp(limit, 1, 200)).ToListAsync();
        return Ok(rows.Select(ToDto).ToList());
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<NotificationDto>> Update([FromRoute] Guid id, [FromBody] NotificationUpdateRequest request)
    {
        var n = await _db.Notifications.FirstOrDefaultAsync(x => x.Id == id);
        if (n is null) return NotFound();

        if (request.IsRead is not null) n.IsRead = request.IsRead.Value;
        await _db.SaveChangesAsync();

        return Ok(ToDto(n));
    }

    [HttpPost("test-sms")]
    public async Task<ActionResult> TestSms([FromServices] PawtralWeb.Services.ISmsService smsService, [FromBody] TestSmsRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Phone))
            return BadRequest(new { error = "Phone number is required." });

        var (success, providerMessage) = await smsService.SendSmsDetailedAsync(request.Phone, request.Message ?? "Pawrtal: Test SMS notification via UniSMS.");
        return Ok(new { success, message = providerMessage });
    }

    [HttpPost("test-email")]
    public async Task<ActionResult> TestEmail([FromServices] PawtralWeb.Services.IEmailService emailService, [FromBody] TestEmailRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
            return BadRequest(new { error = "Email address is required." });

        var subject = request.Subject ?? "🐾 PAWRTAL Email System Test - VM Veterinary Clinic";
        var message = request.Message ?? "Your Gmail SMTP connection (pawrtal.vmclinic@gmail.com) is successfully configured and active!";
        var html = $@"
<!DOCTYPE html>
<html>
<head>
  <meta charset='utf-8'>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }}
    .container {{ max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }}
    .header {{ background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: #ffffff; padding: 28px 24px; text-align: center; }}
    .content {{ padding: 28px 24px; }}
    .card {{ background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 12px; padding: 18px; margin: 18px 0; }}
    .footer {{ background: #f8fafc; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }}
  </style>
</head>
<body>
  <div class='container'>
    <div class='header'>
      <h1 style='margin: 0; font-size: 22px;'>PAWRTAL EMAIL SYSTEM ACTIVE</h1>
      <p style='margin: 6px 0 0; font-size: 13px; opacity: 0.9;'>VM Veterinary Clinic Notification Service</p>
    </div>
    <div class='content'>
      <p style='font-size: 15px; margin-top: 0;'>Hello!</p>
      <div class='card'>
        <p style='margin: 0; font-size: 15px; color: #0f766e; font-weight: 600;'>{System.Net.WebUtility.HtmlEncode(subject)}</p>
        <p style='margin: 8px 0 0; font-size: 14px; color: #334155; line-height: 1.6;'>{System.Net.WebUtility.HtmlEncode(message)}</p>
      </div>
      <p style='font-size: 13px; color: #64748b; margin-top: 20px;'>
        This test confirms that your clinic email (<strong>pawrtal.vmclinic@gmail.com</strong>) is able to dispatch real-time transactional emails to pet owners and clinic staff.
      </p>
    </div>
    <div class='footer'>
      <p style='margin: 0;'>VM Veterinary Clinic • Automated Healthcare Communications</p>
    </div>
  </div>
</body>
</html>";

        var success = await emailService.SendEmailAsync(request.Email, subject, html, message);
        return Ok(new { success, recipient = request.Email });
    }

    private static NotificationDto ToDto(Notification n) => new()
    {
        Id = n.Id.ToString(),
        UserEmail = n.UserEmail,
        Type = n.Type,
        Title = n.Title,
        Message = n.Message,
        RelatedEntityType = n.RelatedEntityType,
        RelatedEntityId = n.RelatedEntityId?.ToString(),
        IsRead = n.IsRead,
        CreatedDate = DateTime.SpecifyKind(n.CreatedAt, DateTimeKind.Utc).ToString("O")
    };
}
