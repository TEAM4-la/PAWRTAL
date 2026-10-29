using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pawtral.Web.Controllers.Api.Dtos;
using PawrtalWeb.Shared;
using PawrtalWeb.Models;

namespace Pawtral.Web.Controllers.Api;

[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly PawrtalDbContext _db;

    public UsersController(PawrtalDbContext db)
    {
        _db = db;
    }

    // Matches frontend usage: api.entities.User.filter({ email })
    [HttpGet]
    public async Task<ActionResult<List<UserDto>>> Filter([FromQuery] string? email)
    {
        IQueryable<User> q = _db.Users.AsNoTracking().Where(u => !u.IsDeleted);

        if (!string.IsNullOrWhiteSpace(email))
            q = q.Where(u => u.Email == email);

        var users = await q.ToListAsync();
        return Ok(users.Select(ToDto).ToList());
    }

    /// <summary>
    /// GET /api/users/veterinarians
    /// Returns only practicing veterinarians for appointment booking and directory selection.
    /// </summary>
    [HttpGet("veterinarians")]
    public async Task<ActionResult<List<UserDto>>> GetVeterinarians()
    {
        var vets = await _db.Users.AsNoTracking()
            .Where(u => !u.IsDeleted && u.UserType == "veterinarian")
            .OrderByDescending(u => u.Email.ToLower() == "rebeccagoyena@pawrtal.com")
            .ThenBy(u => u.FirstName)
            .ThenBy(u => u.LastName)
            .ToListAsync();
        return Ok(vets.Select(ToDto).ToList());
    }

    // Matches frontend usage: api.entities.User.list()
    [HttpGet("list")]
    public async Task<ActionResult<List<UserDto>>> List([FromQuery] string? order, [FromQuery] int limit = 200)
    {
        IQueryable<User> q = _db.Users.AsNoTracking().Where(u => !u.IsDeleted);

        q = order switch
        {
            "-created_date" => q.OrderByDescending(u => u.CreatedAt),
            "created_date" => q.OrderBy(u => u.CreatedAt),
            _ => q.OrderBy(u => u.Email)
        };

        var users = await q.Take(Math.Clamp(limit, 1, 1000)).ToListAsync();
        return Ok(users.Select(ToDto).ToList());
    }

    private static UserDto ToDto(User u)
    {
        object? prefs = null;
        string? displayName = u.DisplayName;
        string? firstName = u.FirstName;
        string? middleName = u.MiddleName;
        string? lastName = u.LastName;
        string? phone = u.Phone;

        if (!string.IsNullOrWhiteSpace(u.NotificationPrefsJson))
        {
            try
            {
                using var doc = JsonDocument.Parse(u.NotificationPrefsJson);
                var root = doc.RootElement;
                if (string.IsNullOrWhiteSpace(displayName) && root.TryGetProperty("display_name", out var dn) && dn.ValueKind == JsonValueKind.String)
                    displayName = dn.GetString();
                if (string.IsNullOrWhiteSpace(firstName) && root.TryGetProperty("first_name", out var fn) && fn.ValueKind == JsonValueKind.String)
                    firstName = fn.GetString();
                if (string.IsNullOrWhiteSpace(middleName) && root.TryGetProperty("middle_name", out var mn) && mn.ValueKind == JsonValueKind.String)
                    middleName = mn.GetString();
                if (string.IsNullOrWhiteSpace(lastName) && root.TryGetProperty("last_name", out var ln) && ln.ValueKind == JsonValueKind.String)
                    lastName = ln.GetString();
                if (string.IsNullOrWhiteSpace(phone) && root.TryGetProperty("phone", out var ph) && ph.ValueKind == JsonValueKind.String)
                    phone = ph.GetString();

                prefs = JsonSerializer.Deserialize<object>(u.NotificationPrefsJson);
            }
            catch
            {
                prefs = null;
            }
        }

        // Clean up accidental title stored in firstName
        if (firstName != null && (firstName.Equals("dr.", StringComparison.OrdinalIgnoreCase) || firstName.Equals("dr", StringComparison.OrdinalIgnoreCase)))
        {
            firstName = null;
        }

        if (string.IsNullOrWhiteSpace(firstName) && !string.IsNullOrWhiteSpace(u.FullName))
        {
            var clean = System.Text.RegularExpressions.Regex.Replace(u.FullName.Trim(), @"^dr\.?\s+", "", System.Text.RegularExpressions.RegexOptions.IgnoreCase).Trim();
            var parts = clean.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length > 0) firstName = parts[0];
            if (parts.Length > 1 && string.IsNullOrWhiteSpace(lastName))
                lastName = parts[1];
        }
        if (string.IsNullOrWhiteSpace(displayName))
        {
            displayName = !string.IsNullOrWhiteSpace(u.FullName) ? u.FullName : firstName;
        }

        return new UserDto
        {
            Id = u.Id.ToString(),
            Email = u.Email,
            DisplayName = displayName,
            FirstName = firstName,
            MiddleName = middleName,
            LastName = lastName,
            FullName = !string.IsNullOrWhiteSpace(displayName) ? displayName : $"{firstName} {lastName}".Trim(),
            UserType = u.UserType,
            Phone = phone,
            Address = u.Address,
            AvatarUrl = u.AvatarUrl,
            LicenseNumber = u.LicenseNumber,
            Specialization = u.Specialization,
            NotificationPreferences = prefs
        };
    }
}

