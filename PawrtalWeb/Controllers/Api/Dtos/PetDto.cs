using System.Text.Json.Serialization;

namespace Pawtral.Web.Controllers.Api.Dtos;

public class PetDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = null!;

    [JsonPropertyName("owner_email")]
    public string? OwnerEmail { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = null!;

    [JsonPropertyName("species")]
    public string Species { get; set; } = null!;

    [JsonPropertyName("breed")]
    public string? Breed { get; set; }

    [JsonPropertyName("date_of_birth")]
    public string? DateOfBirth { get; set; } // yyyy-MM-dd

    [JsonPropertyName("gender")]
    public string? Gender { get; set; }

    [JsonPropertyName("weight")]
    public decimal? Weight { get; set; }

    [JsonPropertyName("color")]
    public string? Color { get; set; }

    [JsonPropertyName("microchip_id")]
    public string? MicrochipId { get; set; }

    [JsonPropertyName("photo_url")]
    public string? PhotoUrl { get; set; }

    [JsonPropertyName("is_neutered")]
    public bool IsNeutered { get; set; }

    [JsonPropertyName("allergies")]
    public List<string> Allergies { get; set; } = [];

    [JsonPropertyName("medical_conditions")]
    public List<string> MedicalConditions { get; set; } = [];

    [JsonPropertyName("created_date")]
    public string CreatedDate { get; set; } = null!; // ISO
}

