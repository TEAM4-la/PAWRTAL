using System.Text.Json.Serialization;

namespace Pawtral.Web.Controllers.Api.Dtos;

public class AppointmentDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = null!;

    [JsonPropertyName("pet_id")]
    public string PetId { get; set; } = null!;

    [JsonPropertyName("owner_email")]
    public string? OwnerEmail { get; set; }

    [JsonPropertyName("vet_email")]
    public string? VetEmail { get; set; }

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
}

