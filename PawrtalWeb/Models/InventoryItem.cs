#nullable disable
using System;

namespace PawrtalWeb.Models;

public partial class InventoryItem
{
    public Guid Id { get; set; }

    /// <summary>
    /// "Vaccine" or "Medication"
    /// </summary>
    public string ItemType { get; set; }

    public string Name { get; set; }

    public string Category { get; set; }

    public string Sku { get; set; }

    public string BatchNumber { get; set; }

    public int Quantity { get; set; }

    /// <summary>
    /// e.g. vials, doses, tablets, bottles, boxes
    /// </summary>
    public string Unit { get; set; }

    public int MinStockLevel { get; set; } = 5;

    public decimal? UnitPrice { get; set; }

    public DateOnly? ExpirationDate { get; set; }

    public string Manufacturer { get; set; }

    public string Notes { get; set; }

    public bool IsDeleted { get; set; } = false;

    public DateTime? DeletedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }
}
