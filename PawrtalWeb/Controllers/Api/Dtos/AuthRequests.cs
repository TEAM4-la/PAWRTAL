namespace Pawtral.Web.Controllers.Api.Dtos;

public class RegisterRequest
{
    public string Email { get; set; } = null!;
    public string Password { get; set; } = null!;
    public string? FullName { get; set; }
}

public class RegisterStaffRequest
{
    public string Email { get; set; } = null!;
    public string Password { get; set; } = null!;
    public string? FullName { get; set; }
    /// <summary>veterinarian | admin</summary>
    public string UserType { get; set; } = null!;
    public string? LicenseNumber { get; set; }
    public string? Specialization { get; set; }
    public string? ClinicName { get; set; }
}

public class LoginRequest
{
    public string Email { get; set; } = null!;
    public string Password { get; set; } = null!;
}

public class ChangePasswordRequest
{
    public string CurrentPassword { get; set; } = null!;
    public string NewPassword { get; set; } = null!;
}

public class AdminResetPasswordRequest
{
    public string TargetEmail { get; set; } = null!;
    public string NewPassword { get; set; } = null!;
}
