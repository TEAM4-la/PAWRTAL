using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pawtral.Web.Controllers.Api.Dtos;
using PawrtalWeb.Shared;
using PawrtalWeb.Models;

namespace Pawtral.Web.Controllers.Api;

[ApiController]
[Route("api/journal-entries")]
public class JournalEntriesController : ControllerBase
{
    private readonly PawrtalDbContext _db;

    public JournalEntriesController(PawrtalDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<JournalEntryDto>>> Filter([FromQuery(Name = "pet_id")] Guid? petId, [FromQuery] string? order)
    {
        IQueryable<JournalEntry> q = _db.JournalEntries.AsNoTracking().Where(e => !e.IsDeleted);

        if (petId is not null)
            q = q.Where(e => e.PetId == petId.Value);

        q = order switch
        {
            "-date" => q.OrderByDescending(e => e.Date),
            "date" => q.OrderBy(e => e.Date),
            _ => q
        };

        var entries = await q.ToListAsync();
        return Ok(entries.Select(ToDto).ToList());
    }

    [HttpPost]
    public async Task<ActionResult<JournalEntryDto>> Create([FromBody] JournalEntryCreateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.PetId)) return ApiUserContext.BadRequestMissing("pet_id");
        if (!Guid.TryParse(request.PetId, out var petId)) return BadRequest(new { error = "pet_id must be a GUID" });
        if (string.IsNullOrWhiteSpace(request.Title)) return ApiUserContext.BadRequestMissing("title");
        if (string.IsNullOrWhiteSpace(request.Date)) return ApiUserContext.BadRequestMissing("date");
        if (!DateOnly.TryParse(request.Date, out var date)) return BadRequest(new { error = "date must be yyyy-MM-dd" });

        var entry = new JournalEntry
        {
            PetId = petId,
            EntryType = string.IsNullOrWhiteSpace(request.EntryType) ? "general" : request.EntryType!,
            Title = request.Title!,
            Content = request.Content,
            Date = date,
            Mood = request.Mood,
            CreatedAt = DateTime.UtcNow
        };

        _db.JournalEntries.Add(entry);
        await _db.SaveChangesAsync();
        return Ok(ToDto(entry));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<JournalEntryDto>> Update([FromRoute] Guid id, [FromBody] JournalEntryCreateRequest request)
    {
        var entry = await _db.JournalEntries.FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted);
        if (entry is null) return NotFound();

        if (request.Title is not null) entry.Title = request.Title;
        if (request.Content is not null) entry.Content = request.Content;
        if (request.EntryType is not null) entry.EntryType = request.EntryType;
        if (request.Mood is not null) entry.Mood = request.Mood;

        if (request.Date is not null)
        {
            if (!DateOnly.TryParse(request.Date, out var date))
                return BadRequest(new { error = "date must be yyyy-MM-dd" });
            entry.Date = date;
        }

        await _db.SaveChangesAsync();
        return Ok(ToDto(entry));
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> Delete([FromRoute] Guid id)
    {
        var entry = await _db.JournalEntries.FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted);
        if (entry is null) return NotFound();

        entry.IsDeleted = true;
        entry.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return NoContent();
    }

    private static JournalEntryDto ToDto(JournalEntry e) => new()
    {
        Id = e.Id.ToString(),
        PetId = e.PetId.ToString(),
        EntryType = e.EntryType,
        Title = e.Title,
        Content = e.Content,
        Date = e.Date.ToString("yyyy-MM-dd"),
        Mood = e.Mood
    };
}

