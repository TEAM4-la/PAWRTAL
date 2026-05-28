using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pawtral.Web.Controllers.Api.Dtos;
using PawrtalWeb.Shared;
using PawrtalWeb.Models;

namespace Pawtral.Web.Controllers.Api;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private const int MinPasswordLength = 6;
    private readonly PawrtalDbContext _db;

    public AuthController(PawrtalDbContext db)
    {
        _db = db;
    }

    private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();

    private async Task<User?> FindUserByEmailAsync(string email, CancellationToken ct = default)
    {
        var norm = NormalizeEmail(email);
        return await _db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == norm, ct);
    }

    [HttpPost("register")]
    public async Task<ActionResult<UserDto>> Register([FromBody] RegisterRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
            return ApiUserContext.BadRequestMissing("email");
        if (!request.Email.Trim().EndsWith("@pawrtal.com", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = "Only @pawrtal.com email addresses are allowed." });
        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < MinPasswordLength)
            return BadRequest(new { error = $"Password must be at least {MinPasswordLength} characters." });

        var originalEmail = request.Email.Trim();
        var email = NormalizeEmail(request.Email);
        var exists = await _db.Users.AnyAsync(u => u.Email.ToLower() == email, ct);
        if (exists)
            return Conflict(new { error = "An account with this email already exists." });

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = originalEmail,
            FullName = string.IsNullOrWhiteSpace(request.FullName) ? null : request.FullName.Trim(),
            UserType = "pet_owner",
            PasswordHash = Utilities.Encrypt(request.Password),
            NotificationPrefsJson = JsonSerializer.Serialize(new
            {
                email = true,
                appointments = true,
                vaccinations = true,
                medications = true
            })
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);
        return Ok(ToDto(user));
    }

    [HttpPost("register-staff")]
    public async Task<ActionResult<UserDto>> RegisterStaff([FromBody] RegisterStaffRequest request, CancellationToken ct)
    {
        var callerEmail = NormalizeEmail(ApiUserContext.GetUserEmail(Request));
        var caller = await FindUserByEmailAsync(callerEmail, ct);
        if (caller is null)
            return Unauthorized(new { error = "Sign in as staff to create accounts." });

        var callerType = caller.UserType?.Trim().ToLowerInvariant();
        if (callerType != "admin")
            return StatusCode(StatusCodes.Status403Forbidden, new { error = "Only admins can create staff accounts." });

        if (string.IsNullOrWhiteSpace(request.Email))
            return ApiUserContext.BadRequestMissing("email");
        if (!request.Email.Trim().EndsWith("@pawrtal.com", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = "Only @pawrtal.com email addresses are allowed." });
        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < MinPasswordLength)
            return BadRequest(new { error = $"Password must be at least {MinPasswordLength} characters." });

        var newType = request.UserType?.Trim().ToLowerInvariant();
        if (newType is not ("veterinarian" or "admin"))
            return BadRequest(new { error = "userType must be veterinarian or admin." });

        if (newType == "admin" && callerType != "admin")
            return StatusCode(StatusCodes.Status403Forbidden, new { error = "Only admins can create admin accounts." });

        var originalEmail = request.Email.Trim();
        var email = NormalizeEmail(request.Email);
        var exists = await _db.Users.AnyAsync(u => u.Email.ToLower() == email, ct);
        if (exists)
            return Conflict(new { error = "An account with this email already exists." });

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = originalEmail,
            FullName = string.IsNullOrWhiteSpace(request.FullName) ? null : request.FullName.Trim(),
            UserType = newType,
            PasswordHash = Utilities.Encrypt(request.Password),
            LicenseNumber = string.IsNullOrWhiteSpace(request.LicenseNumber) ? null : request.LicenseNumber.Trim(),
            Specialization = string.IsNullOrWhiteSpace(request.Specialization) ? null : request.Specialization.Trim(),
            ClinicName = string.IsNullOrWhiteSpace(request.ClinicName) ? null : request.ClinicName.Trim(),
            NotificationPrefsJson = JsonSerializer.Serialize(new
            {
                email = true,
                appointments = true,
                vaccinations = true,
                medications = true
            })
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);
        return Ok(ToDto(user));
    }

    [HttpPost("login")]
    public async Task<ActionResult<UserDto>> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
            return ApiUserContext.BadRequestMissing("email");
        if (!request.Email.Trim().EndsWith("@pawrtal.com", StringComparison.OrdinalIgnoreCase))
            return Unauthorized(new { error = "Only @pawrtal.com email addresses are allowed." });
        if (string.IsNullOrWhiteSpace(request.Password))
            return ApiUserContext.BadRequestMissing("password");

        var user = await FindUserByEmailAsync(request.Email, ct);
        
        // Enforce exact case match for security
        if (user != null && user.Email != request.Email.Trim())
        {
            user = null;
        }

        if (user == null)
            return Unauthorized(new { error = "Invalid email or password." });

        if(user.PasswordHash != null)
        {
            if (Utilities.Decrypt(user.PasswordHash) != request.Password)
                return Unauthorized(new { error = "Invalid email or password." });
        }

        return Ok(ToDto(user));
    }

    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> Me()
    {
        var rawEmail = ApiUserContext.GetUserEmail(Request);
        var email = NormalizeEmail(rawEmail);
        var requestedUserType = ApiUserContext.MapRoleToUserType(ApiUserContext.GetUserRole(Request));

        var user = await FindUserByEmailAsync(email);
        if (user is null)
        {
            user = new User
            {
                Id = Guid.NewGuid(),
                Email = rawEmail.Trim(),
                FullName = "Demo User",
                UserType = requestedUserType ?? "pet_owner",
                NotificationPrefsJson = JsonSerializer.Serialize(new
                {
                    email = true,
                    appointments = true,
                    vaccinations = true,
                    medications = true
                })
            };
            _db.Users.Add(user);
            await _db.SaveChangesAsync();
        }
        else if (!string.IsNullOrWhiteSpace(requestedUserType) && user.UserType != requestedUserType)
        {
            user.UserType = requestedUserType;
            user.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        return Ok(ToDto(user));
    }

    [HttpPut("me")]
    public async Task<ActionResult<UserDto>> UpdateMe([FromBody] UpdateMeRequest request)
    {
        var rawEmail = ApiUserContext.GetUserEmail(Request);
        var email = NormalizeEmail(rawEmail);
        var user = await FindUserByEmailAsync(email);
        if (user is null)
        {
            user = new User { Id = Guid.NewGuid(), Email = rawEmail.Trim(), CreatedAt = DateTime.UtcNow };
            _db.Users.Add(user);
        }

        if (request.FullName is not null) user.FullName = request.FullName;
        if (request.UserType is not null) user.UserType = request.UserType;
        if (request.Phone is not null) user.Phone = request.Phone;
        if (request.Address is not null) user.Address = request.Address;
        if (request.AvatarUrl is not null) user.AvatarUrl = request.AvatarUrl;
        if (request.LicenseNumber is not null) user.LicenseNumber = request.LicenseNumber;
        if (request.Specialization is not null) user.Specialization = request.Specialization;
        if (request.ClinicName is not null) user.ClinicName = request.ClinicName;
        if (request.NotificationPreferences is not null)
            user.NotificationPrefsJson = JsonSerializer.Serialize(request.NotificationPreferences);
        user.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(ToDto(user));
    }

    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.CurrentPassword))
            return ApiUserContext.BadRequestMissing("currentPassword");
        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < MinPasswordLength)
            return BadRequest(new { error = $"New password must be at least {MinPasswordLength} characters." });

        var email = NormalizeEmail(ApiUserContext.GetUserEmail(Request));
        var user = await FindUserByEmailAsync(email, ct);
        if (user is null)
            return Unauthorized(new { error = "User not found." });
        if (string.IsNullOrWhiteSpace(user.PasswordHash))
            return BadRequest(new { error = "No password is set for this account. Use account registration or contact support." });
        if (Utilities.Decrypt(user.PasswordHash) != request.CurrentPassword)
            return Unauthorized(new { error = "Current password is incorrect." });

        user.PasswordHash = Utilities.Encrypt(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpPost("admin-reset-password")]
    public async Task<IActionResult> AdminResetPassword([FromBody] AdminResetPasswordRequest request, CancellationToken ct)
    {
        // Verify caller is an admin
        var callerEmail = NormalizeEmail(ApiUserContext.GetUserEmail(Request));
        var caller = await FindUserByEmailAsync(callerEmail, ct);
        if (caller is null)
            return Unauthorized(new { error = "Sign in as admin to reset passwords." });
        if (caller.UserType?.Trim().ToLowerInvariant() != "admin")
            return StatusCode(StatusCodes.Status403Forbidden, new { error = "Only admins can reset passwords." });

        // Validate request
        if (string.IsNullOrWhiteSpace(request.TargetEmail))
            return BadRequest(new { error = "targetEmail is required." });
        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < MinPasswordLength)
            return BadRequest(new { error = $"New password must be at least {MinPasswordLength} characters." });

        // Find target user
        var target = await FindUserByEmailAsync(request.TargetEmail, ct);
        if (target is null)
            return NotFound(new { error = "User not found." });

        // Only allow resetting pet_owner and veterinarian passwords (not other admins)
        var targetType = target.UserType?.Trim().ToLowerInvariant();
        if (targetType != "pet_owner" && targetType != "veterinarian")
            return BadRequest(new { error = "You can only reset passwords for pet owners and veterinarians." });

        target.PasswordHash = Utilities.Encrypt(request.NewPassword);
        target.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    private static UserDto ToDto(User u)
    {
        object? prefs = null;
        if (!string.IsNullOrWhiteSpace(u.NotificationPrefsJson))
        {
            try
            {
                prefs = JsonSerializer.Deserialize<object>(u.NotificationPrefsJson);
            }
            catch
            {
                prefs = null;
            }
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
