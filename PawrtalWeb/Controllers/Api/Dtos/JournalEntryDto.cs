using System.Text.Json.Serialization;

namespace Pawtral.Web.Controllers.Api.Dtos;

public class JournalEntryDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = null!;

    [JsonPropertyName("pet_id")]
    public string PetId { get; set; } = null!;

    [JsonPropertyName("entry_type")]
    public string EntryType { get; set; } = null!;

    [JsonPropertyName("title")]
    public string Title { get; set; } = null!;

    [JsonPropertyName("content")]
    public string? Content { get; set; }

    [JsonPropertyName("date")]
    public string Date { get; set; } = null!; // yyyy-MM-dd

    [JsonPropertyName("mood")]
    public string? Mood { get; set; }
}

