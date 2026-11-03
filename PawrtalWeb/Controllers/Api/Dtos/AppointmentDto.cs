using System.Text.Json.Serialization;

namespace Pawtral.Web.Controllers.Api.Dtos;

public class AppointmentDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = null!;

    [JsonPropertyName("pet_id")]
    public string PetId { get; set; } = null!;

    [JsonPropertyName("pet_name")]
    public string? PetName { get; set; }

    [JsonPropertyName("owner_email")]
    public string? OwnerEmail { get; set; }

    [JsonPropertyName("owner_name")]
    public string? OwnerName { get; set; }

    [JsonPropertyName("vet_email")]
    public string? VetEmail { get; set; }

    [JsonPropertyName("vet_name")]
    public string? VetName { get; set; }

    [JsonPropertyName("cancelled_by")]
    public string? CancelledBy { get; set; }

    [JsonPropertyName("cancelled_by_name")]
    public string? CancelledByName { get; set; }

    [JsonPropertyName("type")]
    public string Type { get; set; } = null!;

    [JsonPropertyName("date")]
    public string Date { get; set; } = null!; // yyyy-MM-dd

    [JsonPropertyName("time")]
    public string Time { get; set; } = null!;

    [JsonPropertyName("reason")]
    public string? Reason { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = null!;

    [JsonPropertyName("created_at")]
    public DateTime? CreatedAt { get; set; }

    [JsonPropertyName("updated_at")]
    public DateTime? UpdatedAt { get; set; }
}
