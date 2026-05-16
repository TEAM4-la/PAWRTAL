using System.Text.Json.Serialization;

namespace Pawtral.Web.Controllers.Api.Dtos;

public class GroomingRecordDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = null!;

    [JsonPropertyName("pet_id")]
    public string PetId { get; set; } = null!;

    [JsonPropertyName("date")]
    public string Date { get; set; } = null!;

    [JsonPropertyName("groomer_name")]
    public string? GroomerName { get; set; }

    [JsonPropertyName("grooming_type")]
    public string GroomingType { get; set; } = null!;

    [JsonPropertyName("coat_condition_before")]
    public string? CoatConditionBefore { get; set; }

    [JsonPropertyName("coat_style_notes")]
    public string? CoatStyleNotes { get; set; }

    [JsonPropertyName("observations")]
    public string? Observations { get; set; }

    [JsonPropertyName("is_visible_to_owner")]
    public bool IsVisibleToOwner { get; set; }
}
