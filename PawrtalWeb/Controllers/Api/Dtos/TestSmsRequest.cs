using System.Text.Json.Serialization;

namespace Pawtral.Web.Controllers.Api.Dtos;

public class TestSmsRequest
{
    [JsonPropertyName("phone")]
    public string? Phone { get; set; }

    [JsonPropertyName("message")]
    public string? Message { get; set; }
}
