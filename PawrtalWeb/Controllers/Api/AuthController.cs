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

        if (string.IsNullOrWhiteSpace(request.FirstName))
            return BadRequest(new { error = "First name is required." });
        if (string.IsNullOrWhiteSpace(request.LastName))
            return BadRequest(new { error = "Last name is required." });
        if (string.IsNullOrWhiteSpace(request.Phone))
            return BadRequest(new { error = "Phone number is required." });

        var legalParts = new[] { request.FirstName?.Trim(), request.MiddleName?.Trim(), request.LastName?.Trim() }
            .Where(s => !string.IsNullOrWhiteSpace(s));
        var fullLegalName = string.Join(" ", legalParts);

        var rawPhone = request.Phone?.Trim();
        var cleanPhone = !string.IsNullOrWhiteSpace(rawPhone) ? new string(rawPhone.Where(char.IsDigit).ToArray()) : null;

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = originalEmail,
            DisplayName = string.IsNullOrWhiteSpace(request.DisplayName) ? null : request.DisplayName.Trim(),
            FirstName = request.FirstName?.Trim(),
            MiddleName = string.IsNullOrWhiteSpace(request.MiddleName) ? null : request.MiddleName.Trim(),
            LastName = request.LastName?.Trim(),
            Phone = cleanPhone,
            UserType = "pet_owner",
            PasswordHash = Utilities.Encrypt(request.Password),
            NotificationPrefsJson = JsonSerializer.Serialize(new
            {
                email = true,
                appointments = true,
                vaccinations = true,
                medications = true,
                display_name = request.DisplayName?.Trim(),
                first_name = request.FirstName?.Trim(),
                middle_name = request.MiddleName?.Trim(),
                last_name = request.LastName?.Trim(),
                phone = cleanPhone,
                legal_name = fullLegalName
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

        if (string.IsNullOrWhiteSpace(request.FirstName))
            return BadRequest(new { error = "First name is required." });
        if (string.IsNullOrWhiteSpace(request.LastName))
            return BadRequest(new { error = "Last name is required." });
        if (string.IsNullOrWhiteSpace(request.Phone))
            return BadRequest(new { error = "Phone number is required." });

        var legalParts = new[] { request.FirstName?.Trim(), request.MiddleName?.Trim(), request.LastName?.Trim() }
            .Where(s => !string.IsNullOrWhiteSpace(s));
        var fullLegalName = string.Join(" ", legalParts);

        var rawPhone = request.Phone?.Trim();
        var cleanPhone = !string.IsNullOrWhiteSpace(rawPhone) ? new string(rawPhone.Where(char.IsDigit).ToArray()) : null;

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = originalEmail,
            DisplayName = string.IsNullOrWhiteSpace(request.DisplayName) ? null : request.DisplayName.Trim(),
            FirstName = request.FirstName?.Trim(),
            MiddleName = string.IsNullOrWhiteSpace(request.MiddleName) ? null : request.MiddleName.Trim(),
            LastName = request.LastName?.Trim(),
            Phone = cleanPhone,
            UserType = newType,
            PasswordHash = Utilities.Encrypt(request.Password),
            LicenseNumber = string.IsNullOrWhiteSpace(request.LicenseNumber) ? null : request.LicenseNumber.Trim(),
            Specialization = string.IsNullOrWhiteSpace(request.Specialization) ? null : request.Specialization.Trim(),
            NotificationPrefsJson = JsonSerializer.Serialize(new
            {
                email = true,
                appointments = true,
                vaccinations = true,
                medications = true,
                display_name = request.DisplayName?.Trim(),
                first_name = request.FirstName?.Trim(),
                middle_name = request.MiddleName?.Trim(),
                last_name = request.LastName?.Trim(),
                phone = cleanPhone,
                legal_name = fullLegalName
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
        if (string.IsNullOrWhiteSpace(rawEmail))
            return Unauthorized(new { error = "Not authenticated." });

        var email = NormalizeEmail(rawEmail);
        var requestedUserType = ApiUserContext.MapRoleToUserType(ApiUserContext.GetUserRole(Request));

        var user = await FindUserByEmailAsync(email);
        if (user is null)
        {
            return Unauthorized(new { error = "User not found." });
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
        if (string.IsNullOrWhiteSpace(rawEmail))
            return Unauthorized(new { error = "Not authenticated." });

        var email = NormalizeEmail(rawEmail);
        var user = await FindUserByEmailAsync(email);
        if (user is null)
        {
            return Unauthorized(new { error = "User not found." });
        }

        if (request.DisplayName is not null) user.DisplayName = request.DisplayName;
        if (request.FirstName is not null)
        {
            var cleanFirst = System.Text.RegularExpressions.Regex.Replace(request.FirstName.Trim(), @"^dr\.?\s+", "", System.Text.RegularExpressions.RegexOptions.IgnoreCase).Trim();
            user.FirstName = cleanFirst.Length > 0 ? cleanFirst : request.FirstName.Trim();
        }
        if (request.MiddleName is not null) user.MiddleName = request.MiddleName;
        if (request.LastName is not null) user.LastName = request.LastName;
        if (!string.IsNullOrWhiteSpace(request.FullName))
        {
            if (string.IsNullOrWhiteSpace(user.DisplayName)) user.DisplayName = request.FullName.Trim();
            if (string.IsNullOrWhiteSpace(user.FirstName))
            {
                var clean = System.Text.RegularExpressions.Regex.Replace(request.FullName.Trim(), @"^dr\.?\s+", "", System.Text.RegularExpressions.RegexOptions.IgnoreCase).Trim();
                var parts = clean.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length > 0) user.FirstName = parts[0];
                if (parts.Length > 1 && string.IsNullOrWhiteSpace(user.LastName)) user.LastName = parts[1];
            }
        }
        if (request.UserType is not null) user.UserType = request.UserType;
        if (request.Phone is not null)
        {
            var phoneTrimmed = request.Phone.Trim();
            if (phoneTrimmed.Length > 0)
            {
                var digits = new string(phoneTrimmed.Where(char.IsDigit).ToArray());
                if (digits.Length != 11 || !digits.StartsWith("09"))
                {
                    return BadRequest(new { error = "Phone number must be an 11-digit Philippine mobile number starting with 09 (e.g., 09123456789)." });
                }
                user.Phone = digits;
            }
            else
            {
                user.Phone = null;
            }
        }
        if (request.Address is not null) user.Address = request.Address;
        if (request.AvatarUrl is not null) user.AvatarUrl = request.AvatarUrl;
        if (request.LicenseNumber is not null) user.LicenseNumber = request.LicenseNumber;
        if (request.Specialization is not null) user.Specialization = request.Specialization;
        if (request.NotificationPreferences is not null)
            user.NotificationPrefsJson = JsonSerializer.Serialize(request.NotificationPreferences);

        try
        {
            var dict = !string.IsNullOrWhiteSpace(user.NotificationPrefsJson)
                ? JsonSerializer.Deserialize<Dictionary<string, object?>>(user.NotificationPrefsJson) ?? new()
                : new Dictionary<string, object?>();

            if (user.DisplayName != null) dict["display_name"] = user.DisplayName;
            if (user.FirstName != null) dict["first_name"] = user.FirstName;
            if (user.MiddleName != null) dict["middle_name"] = user.MiddleName;
            if (user.LastName != null) dict["last_name"] = user.LastName;
            if (user.Phone != null) dict["phone"] = user.Phone;

            user.NotificationPrefsJson = JsonSerializer.Serialize(dict);
        }
        catch { }

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
