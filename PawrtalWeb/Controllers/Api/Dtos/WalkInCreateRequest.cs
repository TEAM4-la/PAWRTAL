using System.Text.Json.Serialization;

namespace Pawtral.Web.Controllers.Api.Dtos;

public class WalkInCreateRequest
{
    [JsonPropertyName("owner_name")]
    public string OwnerName { get; set; } = null!;

    [JsonPropertyName("owner_phone")]
    public string OwnerPhone { get; set; } = null!;

    [JsonPropertyName("pet_name")]
    public string PetName { get; set; } = null!;

    [JsonPropertyName("species")]
    public string Species { get; set; } = null!;

    [JsonPropertyName("breed")]
    public string? Breed { get; set; }

    [JsonPropertyName("reason")]
    public string? Reason { get; set; }

    [JsonPropertyName("type")]
    public string? Type { get; set; }

    [JsonPropertyName("vet_email")]
    public string? VetEmail { get; set; }
}
