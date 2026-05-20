using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pawtral.Web.Controllers.Api.Dtos;
using PawrtalWeb.Shared;
using PawrtalWeb.Models;
using PawtralWeb.Services;

namespace Pawtral.Web.Controllers.Api;

[ApiController]
[Route("api/health-records")]
public class HealthRecordsController : ControllerBase
{
    private readonly PawrtalDbContext _db;
    private readonly NotificationService _notifications;

    public HealthRecordsController(PawrtalDbContext db, NotificationService notifications)
    {
        _db = db;
        _notifications = notifications;
    }

    [HttpGet]
    public async Task<ActionResult<List<HealthRecordDto>>> Filter(
        [FromQuery(Name = "pet_id")] Guid? petId,
        [FromQuery(Name = "is_visible_to_owner")] bool? visibleToOwner,
        [FromQuery] string? order,
        [FromQuery] int? limit)
    {
        IQueryable<HealthRecord> q = _db.HealthRecords.AsNoTracking();

        if (petId is not null)
            q = q.Where(r => r.PetId == petId.Value);

        if (visibleToOwner is not null)
            q = q.Where(r => r.IsVisibleToOwner == visibleToOwner.Value);

        q = order switch
        {
            "-date" => q.OrderByDescending(r => r.Date),
            "date" => q.OrderBy(r => r.Date),
            _ => q
        };

        if (limit is not null)
        {
            q = q.Take(Math.Clamp(limit.Value, 1, 1000));
        }

        var records = await q.ToListAsync();
        return Ok(records.Select(ToDto).ToList());
    }

    [HttpGet("list")]
    public async Task<ActionResult<List<HealthRecordDto>>> List([FromQuery] string? order, [FromQuery] int limit = 100)
    {
        IQueryable<HealthRecord> q = _db.HealthRecords.AsNoTracking();

        q = order switch
        {
            "-date" => q.OrderByDescending(r => r.Date),
            "date" => q.OrderBy(r => r.Date),
            _ => q.OrderByDescending(r => r.Date)
        };

        var records = await q.Take(Math.Clamp(limit, 1, 1000)).ToListAsync();
        return Ok(records.Select(ToDto).ToList());
    }

    [HttpPost]
    public async Task<ActionResult<HealthRecordDto>> Create([FromBody] HealthRecordCreateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.PetId)) return ApiUserContext.BadRequestMissing("pet_id");
        if (!Guid.TryParse(request.PetId, out var petId)) return BadRequest(new { error = "pet_id must be a GUID" });
        if (string.IsNullOrWhiteSpace(request.Title)) return ApiUserContext.BadRequestMissing("title");

        var recordType = string.IsNullOrWhiteSpace(request.RecordType) ? "diagnosis" : request.RecordType!;
        var date = DateOnly.FromDateTime(DateTime.UtcNow);
        if (!string.IsNullOrWhiteSpace(request.Date))
        {
            if (!DateOnly.TryParse(request.Date, out date))
                return BadRequest(new { error = "date must be yyyy-MM-dd" });
        }

        var record = new HealthRecord
        {
            Id = Guid.NewGuid(),
            PetId = petId,
            RecordType = recordType,
            Title = request.Title!,
            Description = request.Description,
            Date = date,
            FileUrl = request.FileUrl,
            IsVisibleToOwner = request.IsVisibleToOwner ?? true,
            VetEmail = request.VetEmail,
            VetName = request.VetName,
            CreatedAt = DateTime.UtcNow
        };

        _db.HealthRecords.Add(record);
        await _db.SaveChangesAsync();

        if (record.IsVisibleToOwner)
        {
            var pet = await _db.Pets.FirstOrDefaultAsync(p => p.Id == petId);
            if (pet?.OwnerEmail is not null)
            {
                await _notifications.CreateNotificationAsync(
                    pet.OwnerEmail,
                    "health_record",
                    "New Health Record Added",
                    $"A new health record ({record.Title}) has been added for {pet.Name}.",
                    "vaccinations"
                );
            }
        }

        return Ok(ToDto(record));
    }

    private static HealthRecordDto ToDto(HealthRecord r) => new()
    {
        Id = r.Id.ToString(),
        PetId = r.PetId.ToString(),
        RecordType = r.RecordType,
        Title = r.Title,
        Description = r.Description,
        Date = r.Date.ToString("yyyy-MM-dd"),
        FileUrl = r.FileUrl,
        IsVisibleToOwner = r.IsVisibleToOwner,
        VetEmail = r.VetEmail,
        VetName = r.VetName
    };
}

