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
        [FromQuery(Name = "include_unassigned")] bool includeUnassigned,
        [FromQuery(Name = "pet_id")] Guid? petId,
        [FromQuery(Name = "date")] string? date,
        [FromQuery(Name = "status")] string? status,
        [FromQuery(Name = "order")] string? order)
    {
        IQueryable<Appointment> q = _db.Appointments.AsNoTracking().Where(a => !a.IsDeleted);

        if (!string.IsNullOrWhiteSpace(ownerEmail))
            q = q.Where(a => a.OwnerEmail == ownerEmail);

        if (!string.IsNullOrWhiteSpace(vetEmail))
        {
            var cleanVetEmail = vetEmail.Trim();
            if (includeUnassigned)
            {
                q = q.Where(a => (a.VetEmail != null && a.VetEmail == cleanVetEmail) || string.IsNullOrEmpty(a.VetEmail));
            }
            else
            {
                q = q.Where(a => a.VetEmail == cleanVetEmail);
            }
        }

        if (petId is not null)
            q = q.Where(a => a.PetId == petId.Value);

        if (!string.IsNullOrWhiteSpace(date) && DateOnly.TryParse(date, out var parsedDate))
            q = q.Where(a => a.Date == parsedDate);

        if (!string.IsNullOrWhiteSpace(status))
            q = q.Where(a => a.Status == status);

        q = order switch
        {
            "-date" => q.OrderByDescending(a => a.Date),
            "date" => q.OrderBy(a => a.Date),
            _ => q.OrderByDescending(a => a.Date)
        };

        var appts = await q.ToListAsync();
        var petIds = appts.Select(a => a.PetId).Distinct().ToList();
        var petNames = await _db.Pets.AsNoTracking().Where(p => petIds.Contains(p.Id)).ToDictionaryAsync(p => p.Id, p => p.Name);
        var vetEmails = appts.Where(a => !string.IsNullOrEmpty(a.VetEmail)).Select(a => a.VetEmail!.Trim()).Distinct().ToList();
        var vetUsers = await _db.Users.AsNoTracking().Where(u => vetEmails.Contains(u.Email)).ToDictionaryAsync(u => u.Email.Trim(), u => u.FullName, StringComparer.OrdinalIgnoreCase);
        return Ok(appts.Select(a => ToDto(
            a,
            !string.IsNullOrEmpty(a.VetEmail) && vetUsers.TryGetValue(a.VetEmail.Trim(), out var vn) ? vn : null,
            petNames.TryGetValue(a.PetId, out var pn) ? pn : null
        )).ToList());
    }

    [HttpGet("list")]
    public async Task<ActionResult<List<AppointmentDto>>> List([FromQuery] string? order, [FromQuery] int limit = 100)
    {
        IQueryable<Appointment> q = _db.Appointments.AsNoTracking().Where(a => !a.IsDeleted);

        q = order switch
        {
            "-date" => q.OrderByDescending(a => a.Date),
            "date" => q.OrderBy(a => a.Date),
            _ => q.OrderByDescending(a => a.Date)
        };

        var appts = await q.Take(Math.Clamp(limit, 1, 1000)).ToListAsync();
        var petIds = appts.Select(a => a.PetId).Distinct().ToList();
        var petNames = await _db.Pets.AsNoTracking().Where(p => petIds.Contains(p.Id)).ToDictionaryAsync(p => p.Id, p => p.Name);
        var vetEmails = appts.Where(a => !string.IsNullOrEmpty(a.VetEmail)).Select(a => a.VetEmail!.Trim()).Distinct().ToList();
        var vetUsers = await _db.Users.AsNoTracking().Where(u => vetEmails.Contains(u.Email)).ToDictionaryAsync(u => u.Email.Trim(), u => u.FullName, StringComparer.OrdinalIgnoreCase);
        return Ok(appts.Select(a => ToDto(
            a,
            !string.IsNullOrEmpty(a.VetEmail) && vetUsers.TryGetValue(a.VetEmail.Trim(), out var vn) ? vn : null,
            petNames.TryGetValue(a.PetId, out var pn) ? pn : null
        )).ToList());
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

        // Double-booking prevention guard
        if (!string.IsNullOrWhiteSpace(request.VetEmail))
        {
            var vetEmail = request.VetEmail.Trim();
            bool isVetBooked = await _db.Appointments.AnyAsync(a =>
                !a.IsDeleted &&
                a.VetEmail == vetEmail &&
                a.Date == date &&
                a.TimeSlot == request.Time &&
                (a.Status == "pending" || a.Status == "confirmed"));

            if (isVetBooked)
            {
                return Conflict(new { error = "This time slot is already booked for the selected veterinarian. Please choose another time." });
            }
        }
        else
        {
            var vetCount = await _db.Users.CountAsync(u => u.UserType == "veterinarian" && !u.IsDeleted);
            if (vetCount == 0) vetCount = 1;

            var activeCount = await _db.Appointments.CountAsync(a =>
                !a.IsDeleted &&
                a.Date == date &&
                a.TimeSlot == request.Time &&
                (a.Status == "pending" || a.Status == "confirmed"));

            if (activeCount >= vetCount)
            {
                return Conflict(new { error = "All appointment slots for this date and time are currently fully booked. Please choose another time." });
            }
        }

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
        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
        {
            if (ex.InnerException?.Message.Contains("UQ_Appointments_Vet_Date_Slot") == true)
            {
                return Conflict(new { error = "This time slot was just booked by another user. Please choose another time." });
            }
            throw;
        }

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

        string? createdVetName = null;
        if (!string.IsNullOrEmpty(appt.VetEmail))
        {
            var vUser = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Email == appt.VetEmail);
            createdVetName = vUser?.FullName;
        }
        var createdPet = await _db.Pets.AsNoTracking().FirstOrDefaultAsync(p => p.Id == appt.PetId);
        return Ok(ToDto(appt, createdVetName, createdPet?.Name));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<AppointmentDto>> Update([FromRoute] Guid id, [FromBody] AppointmentUpsertRequest request)
    {
        var appt = await _db.Appointments.FirstOrDefaultAsync(a => a.Id == id);
        if (appt is null) return NotFound();

        var callerRole = ApiUserContext.GetUserRole(Request);
        var callerEmail = ApiUserContext.GetUserEmail(Request);
        var callerUser = !string.IsNullOrWhiteSpace(callerEmail) 
            ? await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Email == callerEmail) 
            : null;
        bool isAdmin = string.Equals(callerRole, "admin", StringComparison.OrdinalIgnoreCase) || 
                       string.Equals(callerUser?.UserType, "admin", StringComparison.OrdinalIgnoreCase);

        // Conflict check: only applies when a vet is claiming/confirming an appointment (admins can confirm any appointment)
        if (!isAdmin && (request.Status == "confirmed" || request.Status == "accepted"))
        {
            var claimingVet = !string.IsNullOrWhiteSpace(request.VetEmail) ? request.VetEmail.Trim() : callerEmail?.Trim();

            // 1. If appointment already has an assigned vet that is not the claiming vet
            if (!string.IsNullOrWhiteSpace(appt.VetEmail) && 
                !string.IsNullOrWhiteSpace(claimingVet) && 
                !string.Equals(appt.VetEmail, claimingVet, StringComparison.OrdinalIgnoreCase))
            {
                return Conflict(new { error = "This appointment has already been assigned to or accepted by another veterinarian." });
            }

            // 2. If appointment was already confirmed/completed by anyone
            if ((appt.Status == "confirmed" || appt.Status == "completed") &&
                !string.IsNullOrWhiteSpace(appt.VetEmail) &&
                !string.IsNullOrWhiteSpace(claimingVet) &&
                !string.Equals(appt.VetEmail, claimingVet, StringComparison.OrdinalIgnoreCase))
            {
                return Conflict(new { error = "This appointment has already been accepted by another veterinarian." });
            }
        }

        bool notifyStatus = request.Status is not null && request.Status != appt.Status;
        bool notifyTime = false;

        if (request.OwnerEmail is not null) appt.OwnerEmail = request.OwnerEmail;
        if (!string.IsNullOrWhiteSpace(request.VetEmail))
        {
            appt.VetEmail = request.VetEmail.Trim();
        }
        else if (string.IsNullOrWhiteSpace(appt.VetEmail))
        {
            if (!string.IsNullOrWhiteSpace(callerEmail))
            {
                var caller = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Email == callerEmail);
                if (caller?.UserType?.Equals("veterinarian", StringComparison.OrdinalIgnoreCase) == true)
                {
                    appt.VetEmail = caller.Email;
                }
            }
        }
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

        // Double-booking check on update
        if (!string.IsNullOrWhiteSpace(appt.VetEmail) && (appt.Status == "pending" || appt.Status == "confirmed"))
        {
            bool isDoubleBooked = await _db.Appointments.AnyAsync(a =>
                a.Id != appt.Id &&
                !a.IsDeleted &&
                a.VetEmail == appt.VetEmail &&
                a.Date == appt.Date &&
                a.TimeSlot == appt.TimeSlot &&
                (a.Status == "pending" || a.Status == "confirmed"));

            if (isDoubleBooked)
            {
                return Conflict(new { error = "The selected veterinarian already has an active appointment at this date and time." });
            }
        }

        appt.UpdatedAt = DateTime.UtcNow;
        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
        {
            if (ex.InnerException?.Message.Contains("UQ_Appointments_Vet_Date_Slot") == true)
            {
                return Conflict(new { error = "This time slot was just booked by another user. Please choose another time." });
            }
            throw;
        }

        if (notifyStatus || notifyTime)
        {
            var pet = await _db.Pets.FirstOrDefaultAsync(p => p.Id == appt.PetId);
            string petName = pet?.Name ?? "Your pet";
            string petNameForVet = pet?.Name ?? "A pet";

            var currentUserEmail = ApiUserContext.GetUserEmail(Request);

            // Fetch veterinarian's friendly name if available
            string vetDisplayName = "our veterinary team";
            if (!string.IsNullOrWhiteSpace(appt.VetEmail))
            {
                var vetUser = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Email == appt.VetEmail);
                if (vetUser != null && !string.IsNullOrWhiteSpace(vetUser.FullName))
                {
                    vetDisplayName = $"Dr. {vetUser.FullName}";
                }
                else
                {
                    vetDisplayName = $"Dr. {appt.VetEmail}";
                }
            }

            string msg = notifyTime 
                ? $"The appointment for {petName} has been rescheduled to {appt.Date:MMM d, yyyy} at {appt.TimeSlot}."
                : (appt.Status == "confirmed"
                    ? $"Your appointment for {petName} on {appt.Date:MMM d, yyyy} at {appt.TimeSlot} has been accepted and confirmed by {vetDisplayName}."
                    : $"The appointment for {petName} on {appt.Date:MMM d, yyyy} is now {appt.Status}.");

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
                if (notifyTime || (notifyStatus && (appt.Status == "confirmed" || appt.Status == "cancelled" || appt.Status == "completed")))
                {
                    string notificationTitle = (notifyStatus && appt.Status == "cancelled") 
                        ? "Appointment Cancelled" 
                        : (notifyStatus && appt.Status == "confirmed")
                            ? "Appointment Accepted"
                            : "Appointment Updated";

                    await _notifications.CreateNotificationAsync(
                        appt.OwnerEmail,
                        "appointment",
                        notificationTitle,
                        msg,
                        "appointments"
                    );
                }
            }

            // Notify vet if cancelled
            if (notifyStatus && appt.Status == "cancelled")
            {
                string vetMsg = $"The appointment for {petNameForVet} on {appt.Date:MMM d, yyyy} has been cancelled.";
                if (!string.IsNullOrWhiteSpace(request.Reason))
                {
                    var cancelIndex = request.Reason.LastIndexOf("Cancellation Reason: ");
                    if (cancelIndex >= 0)
                    {
                        vetMsg += $" {request.Reason.Substring(cancelIndex)}";
                    }
                }

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

        string? updatedVetName = null;
        if (!string.IsNullOrEmpty(appt.VetEmail))
        {
            var vUser = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Email == appt.VetEmail);
            updatedVetName = vUser?.FullName;
        }
        var updatedPet = await _db.Pets.AsNoTracking().FirstOrDefaultAsync(p => p.Id == appt.PetId);
        return Ok(ToDto(appt, updatedVetName, updatedPet?.Name));
    }

    private static AppointmentDto ToDto(Appointment a, string? vetName = null, string? petName = null) 
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
            PetName = petName,
            OwnerEmail = a.OwnerEmail,
            VetEmail = a.VetEmail,
            VetName = vetName,
            Type = a.Type,
            Date = a.Date.ToString("yyyy-MM-dd"),
            Time = a.TimeSlot,
            Reason = a.Reason,
            Status = status
        };
    }
}

