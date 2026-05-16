using System.Text.Json.Serialization;

namespace Pawtral.Web.Controllers.Api.Dtos;

public class AppointmentUpsertRequest
{
    [JsonPropertyName("pet_id")]
    public string? PetId { get; set; }

    [JsonPropertyName("owner_email")]
    public string? OwnerEmail { get; set; }

    [JsonPropertyName("vet_email")]
    public string? VetEmail { get; set; }

    [JsonPropertyName("type")]
    public string? Type { get; set; }

    [JsonPropertyName("date")]
    public string? Date { get; set; } // yyyy-MM-dd

    [JsonPropertyName("time")]
    public string? Time { get; set; }

    [JsonPropertyName("reason")]
    public string? Reason { get; set; }

    [JsonPropertyName("status")]
    public string? Status { get; set; }
}

