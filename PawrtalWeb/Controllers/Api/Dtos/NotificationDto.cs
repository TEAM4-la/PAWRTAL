using System.Text.Json.Serialization;

namespace Pawtral.Web.Controllers.Api.Dtos;

public class NotificationDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = null!;

    [JsonPropertyName("user_email")]
    public string UserEmail { get; set; } = null!;

    [JsonPropertyName("type")]
    public string Type { get; set; } = null!;

    [JsonPropertyName("title")]
    public string Title { get; set; } = null!;

    [JsonPropertyName("message")]
    public string Message { get; set; } = null!;

    [JsonPropertyName("related_entity_type")]
    public string? RelatedEntityType { get; set; }

    [JsonPropertyName("related_entity_id")]
    public string? RelatedEntityId { get; set; }

    [JsonPropertyName("is_read")]
    public bool IsRead { get; set; }

    [JsonPropertyName("created_date")]
    public string CreatedDate { get; set; } = null!;
}

