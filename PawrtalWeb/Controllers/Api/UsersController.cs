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
        IQueryable<User> q = _db.Users.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(email))
            q = q.Where(u => u.Email == email);

        var users = await q.ToListAsync();
        return Ok(users.Select(ToDto).ToList());
    }

    // Matches frontend usage: api.entities.User.list()
    [HttpGet("list")]
    public async Task<ActionResult<List<UserDto>>> List([FromQuery] string? order, [FromQuery] int limit = 200)
    {
        IQueryable<User> q = _db.Users.AsNoTracking();

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
        if (!string.IsNullOrWhiteSpace(u.NotificationPrefsJson))
        {
            try { prefs = JsonSerializer.Deserialize<object>(u.NotificationPrefsJson); }
            catch { prefs = null; }
        }

        return new UserDto
        {
            Id = u.Id.ToString(),
            Email = u.Email,
            FullName = u.FullName,
            UserType = u.UserType,
            Phone = u.Phone,
            Address = u.Address,
            AvatarUrl = u.AvatarUrl,
            LicenseNumber = u.LicenseNumber,
            Specialization = u.Specialization,
            ClinicName = u.ClinicName,
            NotificationPreferences = prefs
        };
    }
}

