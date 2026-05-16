using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pawtral.Web.Controllers.Api.Dtos;
using PawrtalWeb.Shared;
using PawrtalWeb.Models;

namespace Pawtral.Web.Controllers.Api;

[ApiController]
[Route("api/grooming-records")]
public class GroomingRecordsController : ControllerBase
{
    private readonly PawrtalDbContext _db;
    private readonly PawtralWeb.Services.NotificationService _notifications;

    public GroomingRecordsController(PawrtalDbContext db, PawtralWeb.Services.NotificationService notifications)
    {
        _db = db;
        _notifications = notifications;
    }

    [HttpGet]
    public async Task<ActionResult<List<GroomingRecordDto>>> Filter(
        [FromQuery(Name = "pet_id")] Guid? petId,
        [FromQuery(Name = "is_visible_to_owner")] bool? isVisibleToOwner,
        [FromQuery] string? order,
        [FromQuery] int? limit)
    {
        IQueryable<GroomingRecord> q = _db.GroomingRecords.AsNoTracking();

        if (petId is not null)
            q = q.Where(g => g.PetId == petId.Value);

        if (isVisibleToOwner is not null)
            q = q.Where(g => g.IsVisibleToOwner == isVisibleToOwner.Value);

        q = order switch
        {
            "-date" => q.OrderByDescending(g => g.Date),
            "date" => q.OrderBy(g => g.Date),
            _ => q.OrderByDescending(g => g.Date)
        };

        if (limit is not null)
            q = q.Take(Math.Clamp(limit.Value, 1, 1000));

        var records = await q.ToListAsync();
        return Ok(records.Select(ToDto).ToList());
    }

    [HttpGet("list")]
    public async Task<ActionResult<List<GroomingRecordDto>>> List(
        [FromQuery] string? order,
        [FromQuery] int limit = 100)
    {
        IQueryable<GroomingRecord> q = _db.GroomingRecords.AsNoTracking();

        q = order switch
        {
            "-date" => q.OrderByDescending(g => g.Date),
            "date" => q.OrderBy(g => g.Date),
            _ => q.OrderByDescending(g => g.Date)
        };

        q = q.Take(Math.Clamp(limit, 1, 1000));

        var records = await q.ToListAsync();
        return Ok(records.Select(ToDto).ToList());
    }

    [HttpPost]
    public async Task<ActionResult<GroomingRecordDto>> Create([FromBody] GroomingRecordCreateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.PetId)) return ApiUserContext.BadRequestMissing("pet_id");
        if (!Guid.TryParse(request.PetId, out var petId)) return BadRequest(new { error = "pet_id must be a GUID" });
        if (string.IsNullOrWhiteSpace(request.GroomingType)) return ApiUserContext.BadRequestMissing("grooming_type");

        var date = DateOnly.FromDateTime(DateTime.UtcNow);
        if (!string.IsNullOrWhiteSpace(request.Date))
        {
            if (!DateOnly.TryParse(request.Date, out date))
                return BadRequest(new { error = "date must be yyyy-MM-dd" });
        }

        var g = new GroomingRecord
        {
            PetId = petId,
            Date = date,
            GroomerName = request.GroomerName,
            GroomingType = request.GroomingType!,
            CoatConditionBefore = request.CoatConditionBefore,
            CoatStyleNotes = request.CoatStyleNotes,
            Observations = request.Observations,
            IsVisibleToOwner = request.IsVisibleToOwner,
            CreatedAt = DateTime.UtcNow
        };

        _db.GroomingRecords.Add(g);
        await _db.SaveChangesAsync();

        var pet = await _db.Pets.FirstOrDefaultAsync(p => p.Id == petId);
        if (pet?.OwnerEmail is not null)
        {
            await _notifications.CreateNotificationAsync(
                pet.OwnerEmail,
                "grooming",
                "Grooming Record Added",
                $"{pet.Name} had a {g.GroomingType.Replace('_', ' ')} grooming session.",
                "appointments"
            );
        }

        return Ok(ToDto(g));
    }

    private static GroomingRecordDto ToDto(GroomingRecord g) => new()
    {
        Id = g.Id.ToString(),
        PetId = g.PetId.ToString(),
        Date = g.Date.ToString("yyyy-MM-dd"),
        GroomerName = g.GroomerName,
        GroomingType = g.GroomingType,
        CoatConditionBefore = g.CoatConditionBefore,
        CoatStyleNotes = g.CoatStyleNotes,
        Observations = g.Observations,
        IsVisibleToOwner = g.IsVisibleToOwner
    };
}
