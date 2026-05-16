using System.Text.Json.Serialization;

namespace Pawtral.Web.Controllers.Api.Dtos;

public class UserDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = null!;

    [JsonPropertyName("email")]
    public string Email { get; set; } = null!;

    [JsonPropertyName("full_name")]
    public string? FullName { get; set; }

    [JsonPropertyName("user_type")]
    public string? UserType { get; set; }

    [JsonPropertyName("phone")]
    public string? Phone { get; set; }

    [JsonPropertyName("address")]
    public string? Address { get; set; }

    [JsonPropertyName("avatar_url")]
    public string? AvatarUrl { get; set; }

    [JsonPropertyName("license_number")]
    public string? LicenseNumber { get; set; }

    [JsonPropertyName("specialization")]
    public string? Specialization { get; set; }

    [JsonPropertyName("clinic_name")]
    public string? ClinicName { get; set; }

    [JsonPropertyName("notification_preferences")]
    public object? NotificationPreferences { get; set; }
}

