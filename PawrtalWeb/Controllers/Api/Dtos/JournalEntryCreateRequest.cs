using System.Text.Json.Serialization;

namespace Pawtral.Web.Controllers.Api.Dtos;

public class JournalEntryCreateRequest
{
    [JsonPropertyName("pet_id")]
    public string? PetId { get; set; }

    [JsonPropertyName("entry_type")]
    public string? EntryType { get; set; }

    [JsonPropertyName("title")]
    public string? Title { get; set; }

    [JsonPropertyName("content")]
    public string? Content { get; set; }

    [JsonPropertyName("date")]
    public string? Date { get; set; } // yyyy-MM-dd

    [JsonPropertyName("mood")]
    public string? Mood { get; set; }
}

