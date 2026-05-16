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

