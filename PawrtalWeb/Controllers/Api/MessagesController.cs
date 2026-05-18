using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pawtral.Web.Controllers.Api.Dtos;
using PawrtalWeb.Shared;
using PawrtalWeb.Models;

namespace Pawtral.Web.Controllers.Api;

[ApiController]
[Route("api/messages")]
public class MessagesController : ControllerBase
{
    private readonly PawrtalDbContext _db;
    private readonly PawtralWeb.Services.NotificationService _notifications;

    public MessagesController(PawrtalDbContext db, PawtralWeb.Services.NotificationService notifications)
    {
        _db = db;
        _notifications = notifications;
    }

    /// <summary>
    /// GET /api/messages?user_email=...
    /// Returns all messages where the current user is sender or receiver (conversation list).
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<MessageDto>>> Filter(
        [FromQuery(Name = "user_email")] string? userEmail,
        [FromQuery] string? order,
        [FromQuery] int limit = 200)
    {
        if (string.IsNullOrWhiteSpace(userEmail))
            return Ok(new List<MessageDto>());

        IQueryable<Message> q = _db.Messages.AsNoTracking()
            .Where(m => m.SenderEmail == userEmail || m.ReceiverEmail == userEmail);

        q = order switch
        {
            "-created_date" => q.OrderByDescending(m => m.CreatedAt),
            "created_date" => q.OrderBy(m => m.CreatedAt),
            _ => q.OrderByDescending(m => m.CreatedAt)
        };

        var rows = await q.Take(Math.Clamp(limit, 1, 1000)).ToListAsync();
        return Ok(rows.Select(ToDto).ToList());
    }

    /// <summary>
    /// GET /api/messages/conversation?user_email=...&other_email=...
    /// Returns all messages between two users.
    /// </summary>
    [HttpGet("conversation")]
    public async Task<ActionResult<List<MessageDto>>> Conversation(
        [FromQuery(Name = "user_email")] string? userEmail,
        [FromQuery(Name = "other_email")] string? otherEmail,
        [FromQuery] int limit = 200)
    {
        if (string.IsNullOrWhiteSpace(userEmail) || string.IsNullOrWhiteSpace(otherEmail))
            return Ok(new List<MessageDto>());

        var rows = await _db.Messages.AsNoTracking()
            .Where(m =>
                (m.SenderEmail == userEmail && m.ReceiverEmail == otherEmail) ||
                (m.SenderEmail == otherEmail && m.ReceiverEmail == userEmail))
            .OrderBy(m => m.CreatedAt)
            .Take(Math.Clamp(limit, 1, 1000))
            .ToListAsync();

        return Ok(rows.Select(ToDto).ToList());
    }

    /// <summary>
    /// POST /api/messages  — send a new message.
    /// Sender is derived from the X-User-Email header.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<MessageDto>> Create([FromBody] MessageCreateRequest request)
    {
        var senderEmail = ApiUserContext.GetUserEmail(Request);

        if (string.IsNullOrWhiteSpace(request.ReceiverEmail))
            return BadRequest(new { error = "receiver_email is required" });

        if (string.IsNullOrWhiteSpace(request.Content))
            return BadRequest(new { error = "content is required" });

        var message = new Message
        {
            Id = Guid.NewGuid(),
            SenderEmail = senderEmail,
            ReceiverEmail = request.ReceiverEmail.Trim(),
            Content = request.Content.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _db.Messages.Add(message);
        await _db.SaveChangesAsync();

        var senderUser = await _db.Users.FirstOrDefaultAsync(u => u.Email == senderEmail);
        var senderName = senderUser?.FullName ?? senderEmail;

        await _notifications.CreateNotificationAsync(
            message.ReceiverEmail,
            "message",
            "New Message",
            $"You have received a new message from {senderName}.",
            "email"
        );

        return Ok(ToDto(message));
    }

    /// <summary>
    /// PUT /api/messages/{id}/read  — mark a message as read.
    /// </summary>
    [HttpPut("{id:guid}/read")]
    public async Task<ActionResult<MessageDto>> MarkRead([FromRoute] Guid id)
    {
        var message = await _db.Messages.FirstOrDefaultAsync(m => m.Id == id);
        if (message is null) return NotFound();

        message.IsRead = true;
        await _db.SaveChangesAsync();

        return Ok(ToDto(message));
    }

    /// <summary>
    /// PUT /api/messages/mark-read-bulk  — mark all messages from a sender as read for the current user.
    /// </summary>
    [HttpPut("mark-read-bulk")]
    public async Task<ActionResult> MarkReadBulk(
        [FromQuery(Name = "sender_email")] string? senderEmail)
    {
        var currentEmail = ApiUserContext.GetUserEmail(Request);

        if (string.IsNullOrWhiteSpace(senderEmail))
            return BadRequest(new { error = "sender_email is required" });

        var unread = await _db.Messages
            .Where(m => m.SenderEmail == senderEmail && m.ReceiverEmail == currentEmail && !m.IsRead)
            .ToListAsync();

        foreach (var m in unread)
            m.IsRead = true;

        await _db.SaveChangesAsync();
        return Ok(new { marked = unread.Count });
    }

    /// <summary>
    /// GET /api/messages/unread-count  — returns count of unread messages for the current user.
    /// </summary>
    [HttpGet("unread-count")]
    public async Task<ActionResult> UnreadCount()
    {
        var currentEmail = ApiUserContext.GetUserEmail(Request);
        var count = await _db.Messages.AsNoTracking()
            .CountAsync(m => m.ReceiverEmail == currentEmail && !m.IsRead);
        return Ok(new { count });
    }

    private static MessageDto ToDto(Message m) => new()
    {
        Id = m.Id.ToString(),
        SenderEmail = m.SenderEmail,
        ReceiverEmail = m.ReceiverEmail,
        Content = m.Content,
        IsRead = m.IsRead,
        CreatedDate = DateTime.SpecifyKind(m.CreatedAt, DateTimeKind.Utc).ToString("O")
    };
}
