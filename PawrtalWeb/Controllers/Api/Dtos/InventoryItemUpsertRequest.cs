using System.Text.Json.Serialization;

namespace Pawtral.Web.Controllers.Api.Dtos;

public class InventoryItemUpsertRequest
{
    [JsonPropertyName("item_type")]
    public string? ItemType { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("category")]
    public string? Category { get; set; }

    [JsonPropertyName("sku")]
    public string? Sku { get; set; }

    [JsonPropertyName("batch_number")]
    public string? BatchNumber { get; set; }

    [JsonPropertyName("quantity")]
    public int? Quantity { get; set; }

    [JsonPropertyName("unit")]
    public string? Unit { get; set; }

    [JsonPropertyName("min_stock_level")]
    public int? MinStockLevel { get; set; }

    [JsonPropertyName("unit_price")]
    public decimal? UnitPrice { get; set; }

    [JsonPropertyName("expiration_date")]
    public string? ExpirationDate { get; set; }

    [JsonPropertyName("manufacturer")]
    public string? Manufacturer { get; set; }

    [JsonPropertyName("notes")]
    public string? Notes { get; set; }
}
