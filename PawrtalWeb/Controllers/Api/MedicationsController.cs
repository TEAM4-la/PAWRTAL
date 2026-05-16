using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pawtral.Web.Controllers.Api.Dtos;
using PawrtalWeb.Shared;
using PawrtalWeb.Models;

namespace Pawtral.Web.Controllers.Api;

[ApiController]
[Route("api/medications")]
public class MedicationsController : ControllerBase
{
    private readonly PawrtalDbContext _db;
    private readonly PawtralWeb.Services.NotificationService _notifications;

    public MedicationsController(PawrtalDbContext db, PawtralWeb.Services.NotificationService notifications)
    {
        _db = db;
        _notifications = notifications;
    }

    [HttpGet]
    public async Task<ActionResult<List<MedicationDto>>> Filter(
        [FromQuery(Name = "pet_id")] Guid? petId,
        [FromQuery(Name = "is_active")] bool? isActive,
        [FromQuery] string? order,
        [FromQuery] int? limit)
    {
        IQueryable<Medication> q = _db.Medications.AsNoTracking();

        if (petId is not null)
            q = q.Where(m => m.PetId == petId.Value);

        q = order switch
        {
            "-start_date" => q.OrderByDescending(m => m.StartDate),
            "start_date" => q.OrderBy(m => m.StartDate),
            _ => q
        };

        if (limit is not null)
            q = q.Take(Math.Clamp(limit.Value, 1, 1000));

        var meds = await q.ToListAsync();
        var dtos = meds.Select(ToDto).ToList();

        // Filter by computed is_active status (accounts for end_date expiration)
        if (isActive is not null)
            dtos = dtos.Where(d => d.IsActive == isActive.Value).ToList();

        return Ok(dtos);
    }

    [HttpPost]
    public async Task<ActionResult<MedicationDto>> Create([FromBody] MedicationCreateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.PetId)) return ApiUserContext.BadRequestMissing("pet_id");
        if (!Guid.TryParse(request.PetId, out var petId)) return BadRequest(new { error = "pet_id must be a GUID" });
        if (string.IsNullOrWhiteSpace(request.Name)) return ApiUserContext.BadRequestMissing("name");

        var start = DateOnly.FromDateTime(DateTime.UtcNow);
        if (!string.IsNullOrWhiteSpace(request.StartDate))
        {
            if (!DateOnly.TryParse(request.StartDate, out start))
                return BadRequest(new { error = "start_date must be yyyy-MM-dd" });
        }

        DateOnly? end = null;
        if (!string.IsNullOrWhiteSpace(request.EndDate))
        {
            if (!DateOnly.TryParse(request.EndDate, out var parsed))
                return BadRequest(new { error = "end_date must be yyyy-MM-dd" });
            end = parsed;
        }

        var med = new Medication
        {
            PetId = petId,
            Name = request.Name!,
            Dosage = request.Dosage,
            Frequency = request.Frequency,
            StartDate = start,
            EndDate = end,
            Notes = request.Notes,
            IsActive = request.IsActive ?? true,
            PrescribedBy = request.PrescribedBy,
            CreatedAt = DateTime.UtcNow
        };

        _db.Medications.Add(med);
        await _db.SaveChangesAsync();

        var pet = await _db.Pets.FirstOrDefaultAsync(p => p.Id == petId);
        if (pet?.OwnerEmail is not null)
        {
            await _notifications.CreateNotificationAsync(
                pet.OwnerEmail,
                "medication",
                "New Medication Prescribed",
                $"{pet.Name} has been prescribed a new medication: {med.Name}.",
                "medications"
            );
        }

        return Ok(ToDto(med));
    }

    private static MedicationDto ToDto(Medication m) => new()
    {
        Id = m.Id.ToString(),
        PetId = m.PetId.ToString(),
        Name = m.Name,
        Dosage = m.Dosage,
        Frequency = m.Frequency,
        StartDate = m.StartDate.ToString("yyyy-MM-dd"),
        EndDate = m.EndDate?.ToString("yyyy-MM-dd"),
        Notes = m.Notes,
        // Compute active status dynamically: if end_date is in the past, medication is completed
        IsActive = m.IsActive && (m.EndDate == null || m.EndDate >= DateOnly.FromDateTime(DateTime.UtcNow)),
        PrescribedBy = m.PrescribedBy
    };
}

