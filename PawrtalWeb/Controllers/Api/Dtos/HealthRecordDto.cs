using System.Text.Json.Serialization;

namespace Pawtral.Web.Controllers.Api.Dtos;

public class HealthRecordDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = null!;

    [JsonPropertyName("pet_id")]
    public string PetId { get; set; } = null!;

    [JsonPropertyName("record_type")]
    public string RecordType { get; set; } = null!;

    [JsonPropertyName("title")]
    public string Title { get; set; } = null!;

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("date")]
    public string Date { get; set; } = null!; // yyyy-MM-dd

    [JsonPropertyName("file_url")]
    public string? FileUrl { get; set; }

    [JsonPropertyName("is_visible_to_owner")]
    public bool IsVisibleToOwner { get; set; }

    [JsonPropertyName("vet_email")]
    public string? VetEmail { get; set; }

    [JsonPropertyName("vet_name")]
    public string? VetName { get; set; }
}

