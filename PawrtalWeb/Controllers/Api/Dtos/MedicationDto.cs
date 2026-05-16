using System.Text.Json.Serialization;

namespace Pawtral.Web.Controllers.Api.Dtos;

public class MedicationDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = null!;

    [JsonPropertyName("pet_id")]
    public string PetId { get; set; } = null!;

    [JsonPropertyName("name")]
    public string Name { get; set; } = null!;

    [JsonPropertyName("dosage")]
    public string? Dosage { get; set; }

    [JsonPropertyName("frequency")]
    public string? Frequency { get; set; }

    [JsonPropertyName("start_date")]
    public string StartDate { get; set; } = null!;

    [JsonPropertyName("end_date")]
    public string? EndDate { get; set; }

    [JsonPropertyName("notes")]
    public string? Notes { get; set; }

    [JsonPropertyName("is_active")]
    public bool IsActive { get; set; }

    [JsonPropertyName("prescribed_by")]
    public string? PrescribedBy { get; set; }
}

