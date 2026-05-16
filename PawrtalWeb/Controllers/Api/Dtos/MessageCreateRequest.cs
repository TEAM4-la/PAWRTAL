using System.Text.Json.Serialization;

namespace Pawtral.Web.Controllers.Api.Dtos;

public class MessageCreateRequest
{
    [JsonPropertyName("receiver_email")]
    public string ReceiverEmail { get; set; } = null!;

    [JsonPropertyName("content")]
    public string Content { get; set; } = null!;
}
