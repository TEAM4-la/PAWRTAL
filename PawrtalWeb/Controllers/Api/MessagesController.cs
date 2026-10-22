using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pawtral.Web.Controllers.Api.Dtos;
using PawrtalWeb.Shared;
using PawrtalWeb.Models;
using System.Text.Json;

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

        var caller = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Email == senderEmail);
        if (caller != null && string.Equals(caller.UserType, "admin", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = "Admin accounts cannot send messages." });

        var receiver = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Email == request.ReceiverEmail.Trim());
        if (receiver != null && string.Equals(receiver.UserType, "admin", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = "Admin cannot receive messages." });

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

    /// <summary>
    /// GET /api/messages/contacts
    /// Returns only users with whom the caller has a legitimate relationship:
    /// - Active conversation threads
    /// - For Pet Owners: Vets from their appointments, vets who created their pets' records, plus clinic admins
    /// - For Vets: Owners with appointments under this vet, or owners of pets this vet treated, plus clinic admins
    /// - For Admins: All staff (vets) and active conversationalists
    /// </summary>
    [HttpGet("contacts")]
    public async Task<ActionResult<List<UserDto>>> GetContacts()
    {
        var callerEmail = ApiUserContext.GetUserEmail(Request);
        if (string.IsNullOrWhiteSpace(callerEmail))
            return Ok(new List<UserDto>());

        var currentUser = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Email == callerEmail);
        var userType = currentUser?.UserType?.ToLowerInvariant() ?? "pet_owner";

        var contactEmails = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        // 1. All existing message threads (people they have already exchanged messages with)
        var msgSenders = await _db.Messages.AsNoTracking()
            .Where(m => m.ReceiverEmail == callerEmail && !m.IsDeleted)
            .Select(m => m.SenderEmail)
            .Distinct()
            .ToListAsync();

        var msgReceivers = await _db.Messages.AsNoTracking()
            .Where(m => m.SenderEmail == callerEmail && !m.IsDeleted)
            .Select(m => m.ReceiverEmail)
            .Distinct()
            .ToListAsync();

        foreach (var email in msgSenders.Concat(msgReceivers))
        {
            if (!string.IsNullOrWhiteSpace(email) && !email.Equals(callerEmail, StringComparison.OrdinalIgnoreCase))
                contactEmails.Add(email.Trim());
        }

        // 2. Role-specific relationships
        if (userType == "pet_owner")
        {
            // Vets from appointments booked by this owner
            var apptVets = await _db.Appointments.AsNoTracking()
                .Where(a => !a.IsDeleted && a.OwnerEmail == callerEmail && !string.IsNullOrWhiteSpace(a.VetEmail))
                .Select(a => a.VetEmail!)
                .Distinct()
                .ToListAsync();
            foreach (var v in apptVets) contactEmails.Add(v.Trim());

            // Vets who authored health records for this owner's pets
            var petIds = await _db.Pets.AsNoTracking()
                .Where(p => !p.IsDeleted && p.OwnerEmail == callerEmail)
                .Select(p => p.Id)
                .ToListAsync();
            if (petIds.Count > 0)
            {
                var recordVets = await _db.HealthRecords.AsNoTracking()
                    .Where(r => !r.IsDeleted && petIds.Contains(r.PetId) && !string.IsNullOrWhiteSpace(r.VetEmail))
                    .Select(r => r.VetEmail!)
                    .Distinct()
                    .ToListAsync();
                foreach (var v in recordVets) contactEmails.Add(v.Trim());
            }

        }
        else if (userType == "veterinarian")
        {
            // Pet owners who have appointments with this vet
            var patientOwners = await _db.Appointments.AsNoTracking()
                .Where(a => !a.IsDeleted && a.VetEmail == callerEmail && !string.IsNullOrWhiteSpace(a.OwnerEmail))
                .Select(a => a.OwnerEmail!)
                .Distinct()
                .ToListAsync();
            foreach (var o in patientOwners) contactEmails.Add(o.Trim());

            // Pet owners whose pets have a health record authored by this vet
            var treatedPetIds = await _db.HealthRecords.AsNoTracking()
                .Where(r => !r.IsDeleted && r.VetEmail == callerEmail)
                .Select(r => r.PetId)
                .Distinct()
                .ToListAsync();
            if (treatedPetIds.Count > 0)
            {
                var recordOwners = await _db.Pets.AsNoTracking()
                    .Where(p => !p.IsDeleted && treatedPetIds.Contains(p.Id) && !string.IsNullOrWhiteSpace(p.OwnerEmail))
                    .Select(p => p.OwnerEmail!)
                    .Distinct()
                    .ToListAsync();
                foreach (var o in recordOwners) contactEmails.Add(o.Trim());
            }
        }
        else // Admin has no messaging feature
        {
            return Ok(new List<UserDto>());
        }

        contactEmails.Remove(callerEmail);

        if (contactEmails.Count == 0)
            return Ok(new List<UserDto>());

        // Never return admin users in messaging contacts
        var matchedUsers = await _db.Users.AsNoTracking()
            .Where(u => !u.IsDeleted && u.UserType != "admin" && contactEmails.Contains(u.Email))
            .ToListAsync();

        var existingUserEmails = new HashSet<string>(matchedUsers.Select(u => u.Email), StringComparer.OrdinalIgnoreCase);

        var result = matchedUsers.Select(ToUserDto).ToList();

        // If an email exists in contacts but has no full user record (fallback)
        foreach (var email in contactEmails)
        {
            if (!existingUserEmails.Contains(email))
            {
                result.Add(new UserDto
                {
                    Id = Guid.NewGuid().ToString(),
                    Email = email,
                    FullName = email.Split('@')[0],
                    UserType = "user"
                });
            }
        }

        return Ok(result);
    }

    private static UserDto ToUserDto(User u)
    {
        object? prefs = null;
        if (!string.IsNullOrWhiteSpace(u.NotificationPrefsJson))
        {
            try { prefs = JsonSerializer.Deserialize<object>(u.NotificationPrefsJson); }
            catch { prefs = null; }
        }

        return new UserDto
        {
            Id = u.Id.ToString(),
            Email = u.Email,
            FullName = u.FullName,
            UserType = u.UserType,
            Phone = u.Phone,
            Address = u.Address,
            AvatarUrl = u.AvatarUrl,
            LicenseNumber = u.LicenseNumber,
            Specialization = u.Specialization,
            NotificationPreferences = prefs
        };
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
