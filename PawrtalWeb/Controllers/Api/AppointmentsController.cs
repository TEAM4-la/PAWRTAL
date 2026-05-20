using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pawtral.Web.Controllers.Api.Dtos;
using PawrtalWeb.Shared;
using PawrtalWeb.Models;

namespace Pawtral.Web.Controllers.Api;

[ApiController]
[Route("api/appointments")]
public class AppointmentsController : ControllerBase
{
    private readonly PawrtalDbContext _db;
    private readonly PawtralWeb.Services.NotificationService _notifications;

    public AppointmentsController(PawrtalDbContext db, PawtralWeb.Services.NotificationService notifications)
    {
        _db = db;
        _notifications = notifications;
    }

    [HttpGet]
    public async Task<ActionResult<List<AppointmentDto>>> Filter(
        [FromQuery(Name = "owner_email")] string? ownerEmail,
        [FromQuery(Name = "vet_email")] string? vetEmail,
        [FromQuery(Name = "pet_id")] Guid? petId)
    {
        IQueryable<Appointment> q = _db.Appointments.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(ownerEmail))
            q = q.Where(a => a.OwnerEmail == ownerEmail);

        if (!string.IsNullOrWhiteSpace(vetEmail))
            q = q.Where(a => a.VetEmail == vetEmail);

        if (petId is not null)
            q = q.Where(a => a.PetId == petId.Value);

        var appts = await q.ToListAsync();
        return Ok(appts.Select(ToDto).ToList());
    }

    [HttpGet("list")]
    public async Task<ActionResult<List<AppointmentDto>>> List([FromQuery] string? order, [FromQuery] int limit = 100)
    {
        IQueryable<Appointment> q = _db.Appointments.AsNoTracking();

        q = order switch
        {
            "-date" => q.OrderByDescending(a => a.Date),
            "date" => q.OrderBy(a => a.Date),
            _ => q.OrderByDescending(a => a.Date)
        };

        var appts = await q.Take(Math.Clamp(limit, 1, 1000)).ToListAsync();
        return Ok(appts.Select(ToDto).ToList());
    }

    [HttpPost]
    public async Task<ActionResult<AppointmentDto>> Create([FromBody] AppointmentUpsertRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.PetId)) return ApiUserContext.BadRequestMissing("pet_id");
        if (!Guid.TryParse(request.PetId, out var petId)) return BadRequest(new { error = "pet_id must be a GUID" });
        if (string.IsNullOrWhiteSpace(request.Type)) return ApiUserContext.BadRequestMissing("type");
        if (string.IsNullOrWhiteSpace(request.Date)) return ApiUserContext.BadRequestMissing("date");
        if (string.IsNullOrWhiteSpace(request.Time)) return ApiUserContext.BadRequestMissing("time");
        if (!DateOnly.TryParse(request.Date, out var date)) return BadRequest(new { error = "date must be yyyy-MM-dd" });

        var appt = new Appointment
        {
            Id = Guid.NewGuid(),
            PetId = petId,
            OwnerEmail = request.OwnerEmail,
            VetEmail = request.VetEmail,
            Type = request.Type,
            Date = date,
            TimeSlot = request.Time,
            Reason = request.Reason,
            Status = request.Status ?? "pending",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Appointments.Add(appt);
        await _db.SaveChangesAsync();

        var pet = await _db.Pets.FirstOrDefaultAsync(p => p.Id == petId);
        string petName = pet?.Name ?? "Your pet";
        string petNameForVet = pet?.Name ?? "A pet";

        if (!string.IsNullOrWhiteSpace(appt.VetEmail))
        {
            await _notifications.CreateNotificationAsync(
                appt.VetEmail,
                "appointment",
                "New Appointment Booking",
                $"A new appointment ({appt.Type.Replace("_", " ")}) for {petNameForVet} has been scheduled for {appt.Date:MMM d, yyyy} at {appt.TimeSlot}.",
                "appointments"
            );
        }
        else
        {
            // Notify all veterinarians if no specific vet is assigned
            var vets = await _db.Users.Where(u => u.UserType == "veterinarian").ToListAsync();
            foreach (var vet in vets)
            {
                if (!string.IsNullOrWhiteSpace(vet.Email))
                {
                    await _notifications.CreateNotificationAsync(
                        vet.Email,
                        "appointment",
                        "New Appointment Booking",
                        $"A new appointment ({appt.Type.Replace("_", " ")}) for {petNameForVet} has been scheduled for {appt.Date:MMM d, yyyy} at {appt.TimeSlot} and needs to be assigned.",
                        "appointments"
                    );
                }
            }
        }

        return Ok(ToDto(appt));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<AppointmentDto>> Update([FromRoute] Guid id, [FromBody] AppointmentUpsertRequest request)
    {
        var appt = await _db.Appointments.FirstOrDefaultAsync(a => a.Id == id);
        if (appt is null) return NotFound();

        bool notifyStatus = request.Status is not null && request.Status != appt.Status;
        bool notifyTime = false;

        if (request.OwnerEmail is not null) appt.OwnerEmail = request.OwnerEmail;
        if (request.VetEmail is not null) appt.VetEmail = request.VetEmail;
        if (request.Type is not null) appt.Type = request.Type;
        
        if (request.Time is not null && request.Time != appt.TimeSlot) 
        {
            appt.TimeSlot = request.Time;
            notifyTime = true;
        }
        
        if (request.Reason is not null) appt.Reason = request.Reason;
        
        if (request.Status is not null) 
        {
            appt.Status = request.Status;
        }

        if (request.Date is not null)
        {
            if (!DateOnly.TryParse(request.Date, out var date))
                return BadRequest(new { error = "date must be yyyy-MM-dd" });
                
            if (date != appt.Date)
            {
                appt.Date = date;
                notifyTime = true;
            }
        }

        appt.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        if (notifyStatus || notifyTime)
        {
            var pet = await _db.Pets.FirstOrDefaultAsync(p => p.Id == appt.PetId);
            string petName = pet?.Name ?? "Your pet";
            string petNameForVet = pet?.Name ?? "A pet";

            var currentUserEmail = ApiUserContext.GetUserEmail(Request);

            string msg = notifyTime 
                ? $"The appointment for {petName} has been rescheduled to {appt.Date:MMM d, yyyy} at {appt.TimeSlot}."
                : $"The appointment for {petName} on {appt.Date:MMM d, yyyy} is now {appt.Status}.";

            if (notifyStatus && appt.Status == "cancelled" && !string.IsNullOrWhiteSpace(request.Reason))
            {
                var cancelIndex = request.Reason.LastIndexOf("Cancellation Reason: ");
                if (cancelIndex >= 0)
                {
                    msg += $" {request.Reason.Substring(cancelIndex)}";
                }
            }

            if (!string.Equals(appt.OwnerEmail, currentUserEmail, StringComparison.OrdinalIgnoreCase))
            {
                if (notifyTime || (notifyStatus && (appt.Status == "confirmed" || appt.Status == "cancelled")))
                {
                    await _notifications.CreateNotificationAsync(
                        appt.OwnerEmail,
                        "appointment",
                        "Appointment Updated",
                        msg,
                        "appointments"
                    );
                }
            }

            // Notify vet if cancelled
            if (notifyStatus && appt.Status == "cancelled")
            {
                string vetMsg = $"The appointment for {petNameForVet} on {appt.Date:MMM d, yyyy} has been cancelled.";
                if (!string.IsNullOrWhiteSpace(appt.VetEmail))
                {
                    if (!string.Equals(appt.VetEmail, currentUserEmail, StringComparison.OrdinalIgnoreCase))
                    {
                        await _notifications.CreateNotificationAsync(
                            appt.VetEmail,
                            "appointment",
                            "Appointment Cancelled",
                            vetMsg,
                            "appointments"
                        );
                    }
                }
                else
                {
                    var vets = await _db.Users.Where(u => u.UserType == "veterinarian").ToListAsync();
                    foreach (var vet in vets)
                    {
                        if (!string.IsNullOrWhiteSpace(vet.Email) && !string.Equals(vet.Email, currentUserEmail, StringComparison.OrdinalIgnoreCase))
                        {
                            await _notifications.CreateNotificationAsync(
                                vet.Email,
                                "appointment",
                                "Appointment Cancelled",
                                vetMsg,
                                "appointments"
                            );
                        }
                    }
                }
            }
        }

        return Ok(ToDto(appt));
    }

    private static AppointmentDto ToDto(Appointment a) 
    {
        var status = a.Status;
        if (status == "pending")
        {
            var today = DateOnly.FromDateTime(DateTime.Now);
            var now = DateTime.Now;

            if (a.Date < today)
            {
                status = "expired";
            }
            else if (a.Date == today)
            {
                if (DateTime.TryParseExact($"{a.Date:yyyy-MM-dd} {a.TimeSlot}", "yyyy-MM-dd hh:mm tt", System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.None, out var apptDateTime))
                {
                    if (apptDateTime <= now)
                    {
                        status = "expired";
                    }
                }
            }
        }

        return new AppointmentDto
        {
            Id = a.Id.ToString(),
            PetId = a.PetId.ToString(),
            OwnerEmail = a.OwnerEmail,
            VetEmail = a.VetEmail,
            Type = a.Type,
            Date = a.Date.ToString("yyyy-MM-dd"),
            Time = a.TimeSlot,
            Reason = a.Reason,
            Status = status
        };
    }
}

