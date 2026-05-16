using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pawtral.Web.Controllers.Api.Dtos;
using PawrtalWeb.Shared;
using PawrtalWeb.Models;
using PawtralWeb.Services;

namespace Pawtral.Web.Controllers.Api;

[ApiController]
[Route("api/vaccinations")]
public class VaccinationsController : ControllerBase
{
    private readonly PawrtalDbContext _db;
    private readonly NotificationService _notifications;

    public VaccinationsController(PawrtalDbContext db, NotificationService notifications)
    {
        _db = db;
        _notifications = notifications;
    }

    [HttpGet]
    public async Task<ActionResult<List<VaccinationDto>>> Filter(
        [FromQuery(Name = "pet_id")] Guid? petId,
        [FromQuery] string? order,
        [FromQuery] int? limit)
    {
        IQueryable<Vaccination> q = _db.Vaccinations.AsNoTracking();

        if (petId is not null)
            q = q.Where(v => v.PetId == petId.Value);

        q = order switch
        {
            "-date_administered" => q.OrderByDescending(v => v.DateAdministered),
            "date_administered" => q.OrderBy(v => v.DateAdministered),
            _ => q
        };

        if (limit is not null)
            q = q.Take(Math.Clamp(limit.Value, 1, 1000));

        var vax = await q.ToListAsync();
        return Ok(vax.Select(ToDto).ToList());
    }

    [HttpPost]
    public async Task<ActionResult<VaccinationDto>> Create([FromBody] VaccinationCreateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.PetId)) return ApiUserContext.BadRequestMissing("pet_id");
        if (!Guid.TryParse(request.PetId, out var petId)) return BadRequest(new { error = "pet_id must be a GUID" });
        if (string.IsNullOrWhiteSpace(request.VaccineName)) return ApiUserContext.BadRequestMissing("vaccine_name");

        var dateAdmin = DateOnly.FromDateTime(DateTime.UtcNow);
        if (!string.IsNullOrWhiteSpace(request.DateAdministered))
        {
            if (!DateOnly.TryParse(request.DateAdministered, out dateAdmin))
                return BadRequest(new { error = "date_administered must be yyyy-MM-dd" });
        }

        DateOnly? nextDue = null;
        if (!string.IsNullOrWhiteSpace(request.NextDueDate))
        {
            if (!DateOnly.TryParse(request.NextDueDate, out var parsed))
                return BadRequest(new { error = "next_due_date must be yyyy-MM-dd" });
            nextDue = parsed;
        }

        var v = new Vaccination
        {
            PetId = petId,
            VaccineName = request.VaccineName!,
            DateAdministered = dateAdmin,
            NextDueDate = nextDue,
            BatchNumber = request.BatchNumber,
            Notes = request.Notes,
            AdministeredBy = request.AdministeredBy,
            CreatedAt = DateTime.UtcNow
        };

        _db.Vaccinations.Add(v);
        await _db.SaveChangesAsync();

        var pet = await _db.Pets.FirstOrDefaultAsync(p => p.Id == petId);
        if (pet?.OwnerEmail is not null)
        {
            await _notifications.CreateNotificationAsync(
                pet.OwnerEmail,
                "vaccination",
                "Vaccination Added",
                $"{pet.Name} received the {v.VaccineName} vaccination.",
                "vaccinations"
            );
        }

        return Ok(ToDto(v));
    }

    private static VaccinationDto ToDto(Vaccination v) => new()
    {
        Id = v.Id.ToString(),
        PetId = v.PetId.ToString(),
        VaccineName = v.VaccineName,
        DateAdministered = v.DateAdministered.ToString("yyyy-MM-dd"),
        NextDueDate = v.NextDueDate?.ToString("yyyy-MM-dd"),
        BatchNumber = v.BatchNumber,
        Notes = v.Notes,
        AdministeredBy = v.AdministeredBy
    };
}

