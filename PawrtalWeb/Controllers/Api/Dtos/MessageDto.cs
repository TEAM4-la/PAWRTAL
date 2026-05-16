using System.Text.Json.Serialization;

namespace Pawtral.Web.Controllers.Api.Dtos;

public class MessageDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = null!;

    [JsonPropertyName("sender_email")]
    public string SenderEmail { get; set; } = null!;

    [JsonPropertyName("receiver_email")]
    public string ReceiverEmail { get; set; } = null!;

    [JsonPropertyName("content")]
    public string Content { get; set; } = null!;

    [JsonPropertyName("is_read")]
    public bool IsRead { get; set; }

    [JsonPropertyName("created_date")]
    public string CreatedDate { get; set; } = null!;
}
