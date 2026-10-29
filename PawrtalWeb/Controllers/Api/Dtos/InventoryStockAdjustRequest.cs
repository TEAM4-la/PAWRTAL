using System.Text.Json.Serialization;

namespace Pawtral.Web.Controllers.Api.Dtos;

public class InventoryStockAdjustRequest
{
    /// <summary>
    /// "add" (receive stock), "subtract" (dispense/use stock), or "set" (manual count adjustment)
    /// </summary>
    [JsonPropertyName("mode")]
    public string Mode { get; set; } = "add";

    [JsonPropertyName("amount")]
    public int Amount { get; set; }

    [JsonPropertyName("reason")]
    public string? Reason { get; set; }
}
