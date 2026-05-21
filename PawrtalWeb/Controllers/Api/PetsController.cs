using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pawtral.Web.Controllers.Api.Dtos;
using PawrtalWeb.Shared;
using PawrtalWeb.Models;

namespace Pawtral.Web.Controllers.Api;

[ApiController]
[Route("api/pets")]
public class PetsController : ControllerBase
{
    private readonly PawrtalDbContext _db;

    public PetsController(PawrtalDbContext db)
    {
        _db = db;
    }

    // Matches frontend usage: api.entities.Pet.filter({ id }) or filter({ owner_email })
    [HttpGet]
    public async Task<ActionResult<List<PetDto>>> Filter([FromQuery(Name = "id")] Guid? id, [FromQuery(Name = "owner_email")] string? ownerEmail)
    {
        IQueryable<Pet> q = _db.Pets
            .AsNoTracking()
            .Where(p => !p.IsDeleted)
            .Include(p => p.PetAllergies)
            .Include(p => p.PetMedicalConditions);

        if (id is not null)
        {
            q = q.Where(p => p.Id == id.Value);
        }

        if (!string.IsNullOrWhiteSpace(ownerEmail))
        {
            q = q.Where(p => p.OwnerEmail == ownerEmail);
        }

        var pets = await q.ToListAsync();
        return Ok(pets.Select(ToDto).ToList());
    }

    // Matches frontend usage: api.entities.Pet.list('-created_date', 100)
    [HttpGet("list")]
    public async Task<ActionResult<List<PetDto>>> List([FromQuery] string? order, [FromQuery] int limit = 100)
    {
        IQueryable<Pet> q = _db.Pets
            .AsNoTracking()
            .Where(p => !p.IsDeleted)
            .Include(p => p.PetAllergies)
            .Include(p => p.PetMedicalConditions);

        q = order switch
        {
            "-created_date" => q.OrderByDescending(p => p.CreatedAt),
            "created_date" => q.OrderBy(p => p.CreatedAt),
            "-name" => q.OrderByDescending(p => p.Name),
            "name" => q.OrderBy(p => p.Name),
            _ => q.OrderByDescending(p => p.CreatedAt)
        };

        var pets = await q.Take(Math.Clamp(limit, 1, 500)).ToListAsync();
        return Ok(pets.Select(ToDto).ToList());
    }

    [HttpPost]
    public async Task<ActionResult<PetDto>> Create([FromBody] PetUpsertRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name)) return ApiUserContext.BadRequestMissing("name");
        if (string.IsNullOrWhiteSpace(request.Species)) return ApiUserContext.BadRequestMissing("species");

        var pet = new Pet
        {
            Id = Guid.NewGuid(),
            OwnerEmail = request.OwnerEmail,
            Name = request.Name.Trim(),
            Species = request.Species.Trim(),
            Breed = request.Breed,
            Gender = request.Gender,
            WeightKg = request.Weight,
            Color = request.Color,
            MicrochipId = request.MicrochipId,
            PhotoUrl = request.PhotoUrl,
            IsNeutered = request.IsNeutered ?? false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        if (!string.IsNullOrWhiteSpace(request.DateOfBirth) && DateOnly.TryParse(request.DateOfBirth, out var dob))
        {
            pet.DateOfBirth = dob;
        }

        ApplyTags(pet, request.Allergies, request.MedicalConditions);

        _db.Pets.Add(pet);
        await _db.SaveChangesAsync();

        return Ok(ToDto(pet));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<PetDto>> Update([FromRoute] Guid id, [FromBody] PetUpsertRequest request)
    {
        var pet = await _db.Pets
            .Include(p => p.PetAllergies)
            .Include(p => p.PetMedicalConditions)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (pet is null) return NotFound();

        if (request.OwnerEmail is not null) pet.OwnerEmail = request.OwnerEmail;
        if (request.Name is not null) pet.Name = request.Name.Trim();
        if (request.Species is not null) pet.Species = request.Species.Trim();
        if (request.Breed is not null) pet.Breed = request.Breed;
        if (request.Gender is not null) pet.Gender = request.Gender;
        if (request.Weight is not null) pet.WeightKg = request.Weight;
        if (request.Color is not null) pet.Color = request.Color;
        if (request.MicrochipId is not null) pet.MicrochipId = request.MicrochipId;
        if (request.PhotoUrl is not null) pet.PhotoUrl = request.PhotoUrl;
        if (request.IsNeutered is not null) pet.IsNeutered = request.IsNeutered.Value;

        if (request.DateOfBirth is not null)
        {
            pet.DateOfBirth = DateOnly.TryParse(request.DateOfBirth, out var dob) ? dob : null;
        }

        if (request.Allergies is not null || request.MedicalConditions is not null)
        {
            ApplyTags(pet, request.Allergies, request.MedicalConditions);
        }

        pet.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(ToDto(pet));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete([FromRoute] Guid id)
    {
        var pet = await _db.Pets.FirstOrDefaultAsync(p => p.Id == id);
        if (pet is null) return NotFound();

        var now = DateTime.UtcNow;

        // Soft delete the pet
        pet.IsDeleted = true;
        pet.DeletedAt = now;

        // Soft delete all related child records
        await _db.Medications.IgnoreQueryFilters()
            .Where(m => m.PetId == id && !m.IsDeleted)
            .ExecuteUpdateAsync(s => s
                .SetProperty(m => m.IsDeleted, true)
                .SetProperty(m => m.DeletedAt, now));

        await _db.Vaccinations.IgnoreQueryFilters()
            .Where(v => v.PetId == id && !v.IsDeleted)
            .ExecuteUpdateAsync(s => s
                .SetProperty(v => v.IsDeleted, true)
                .SetProperty(v => v.DeletedAt, now));

        await _db.Appointments.IgnoreQueryFilters()
            .Where(a => a.PetId == id && !a.IsDeleted)
            .ExecuteUpdateAsync(s => s
                .SetProperty(a => a.IsDeleted, true)
                .SetProperty(a => a.DeletedAt, now));

        await _db.HealthRecords.IgnoreQueryFilters()
            .Where(h => h.PetId == id && !h.IsDeleted)
            .ExecuteUpdateAsync(s => s
                .SetProperty(h => h.IsDeleted, true)
                .SetProperty(h => h.DeletedAt, now));

        await _db.JournalEntries.IgnoreQueryFilters()
            .Where(j => j.PetId == id && !j.IsDeleted)
            .ExecuteUpdateAsync(s => s
                .SetProperty(j => j.IsDeleted, true)
                .SetProperty(j => j.DeletedAt, now));

        await _db.GroomingRecords.IgnoreQueryFilters()
            .Where(g => g.PetId == id && !g.IsDeleted)
            .ExecuteUpdateAsync(s => s
                .SetProperty(g => g.IsDeleted, true)
                .SetProperty(g => g.DeletedAt, now));

        await _db.SaveChangesAsync();
        return Ok(new { id = id.ToString() });
    }

    private static void ApplyTags(Pet pet, List<string>? allergies, List<string>? medicalConditions)
    {
        if (allergies is not null)
        {
            pet.PetAllergies.Clear();
            foreach (var a in allergies.Where(x => !string.IsNullOrWhiteSpace(x)).Select(x => x.Trim()).Distinct(StringComparer.OrdinalIgnoreCase))
            {
                pet.PetAllergies.Add(new PetAllergy { PetId = pet.Id, Value = a });
            }
        }

        if (medicalConditions is not null)
        {
            pet.PetMedicalConditions.Clear();
            foreach (var c in medicalConditions.Where(x => !string.IsNullOrWhiteSpace(x)).Select(x => x.Trim()).Distinct(StringComparer.OrdinalIgnoreCase))
            {
                pet.PetMedicalConditions.Add(new PetMedicalCondition { PetId = pet.Id, Value = c });
            }
        }
    }

    private static PetDto ToDto(Pet p) => new()
    {
        Id = p.Id.ToString(),
        OwnerEmail = p.OwnerEmail,
        Name = p.Name,
        Species = p.Species,
        Breed = p.Breed,
        DateOfBirth = p.DateOfBirth?.ToString("yyyy-MM-dd"),
        Gender = p.Gender,
        Weight = p.WeightKg,
        Color = p.Color,
        MicrochipId = p.MicrochipId,
        PhotoUrl = p.PhotoUrl,
        IsNeutered = p.IsNeutered,
        Allergies = p.PetAllergies.Select(a => a.Value).ToList(),
        MedicalConditions = p.PetMedicalConditions.Select(c => c.Value).ToList(),
        CreatedDate = DateTime.SpecifyKind(p.CreatedAt, DateTimeKind.Utc).ToString("O")
    };
}

