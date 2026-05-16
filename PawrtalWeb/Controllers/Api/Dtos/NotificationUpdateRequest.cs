using System.Text.Json.Serialization;

namespace Pawtral.Web.Controllers.Api.Dtos;

public class NotificationUpdateRequest
{
    [JsonPropertyName("is_read")]
    public bool? IsRead { get; set; }
}

