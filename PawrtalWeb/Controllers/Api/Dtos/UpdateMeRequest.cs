using System.Text.Json.Serialization;

namespace Pawtral.Web.Controllers.Api.Dtos;

public class UpdateMeRequest
{
    [JsonPropertyName("full_name")]
    public string? FullName { get; set; }

    [JsonPropertyName("user_type")]
    public string? UserType { get; set; } // pet_owner | veterinarian | admin

    [JsonPropertyName("phone")]
    public string? Phone { get; set; }

    [JsonPropertyName("address")]
    public string? Address { get; set; }

    [JsonPropertyName("avatar_url")]
    public string? AvatarUrl { get; set; }

    // onboarding extras (safe to ignore if unused)
    [JsonPropertyName("license_number")]
    public string? LicenseNumber { get; set; }

    [JsonPropertyName("specialization")]
    public string? Specialization { get; set; }

    [JsonPropertyName("clinic_name")]
    public string? ClinicName { get; set; }

    [JsonPropertyName("notification_preferences")]
    public object? NotificationPreferences { get; set; }
}

