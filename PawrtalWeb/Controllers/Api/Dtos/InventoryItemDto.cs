using System.Text.Json.Serialization;

namespace Pawtral.Web.Controllers.Api.Dtos;

public class InventoryItemDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = null!;

    [JsonPropertyName("item_type")]
    public string ItemType { get; set; } = null!; // "Vaccine" or "Medication"

    [JsonPropertyName("name")]
    public string Name { get; set; } = null!;

    [JsonPropertyName("category")]
    public string? Category { get; set; }

    [JsonPropertyName("sku")]
    public string? Sku { get; set; }

    [JsonPropertyName("batch_number")]
    public string? BatchNumber { get; set; }

    [JsonPropertyName("quantity")]
    public int Quantity { get; set; }

    [JsonPropertyName("unit")]
    public string? Unit { get; set; }

    [JsonPropertyName("min_stock_level")]
    public int MinStockLevel { get; set; }

    [JsonPropertyName("unit_price")]
    public decimal? UnitPrice { get; set; }

    [JsonPropertyName("expiration_date")]
    public string? ExpirationDate { get; set; }

    [JsonPropertyName("manufacturer")]
    public string? Manufacturer { get; set; }

    [JsonPropertyName("notes")]
    public string? Notes { get; set; }

    [JsonPropertyName("is_low_stock")]
    public bool IsLowStock { get; set; }

    [JsonPropertyName("is_out_of_stock")]
    public bool IsOutOfStock { get; set; }

    [JsonPropertyName("is_expired")]
    public bool IsExpired { get; set; }

    [JsonPropertyName("is_expiring_soon")]
    public bool IsExpiringSoon { get; set; }

    [JsonPropertyName("created_at")]
    public DateTime CreatedAt { get; set; }

    [JsonPropertyName("updated_at")]
    public DateTime? UpdatedAt { get; set; }
}
