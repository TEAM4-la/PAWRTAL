using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PawrtalWeb.Models;
using PawrtalWeb.Shared;
using Pawtral.Web.Controllers.Api.Dtos;

namespace Pawtral.Web.Controllers.Api;

[ApiController]
[Route("api/inventory")]
public class InventoryController : ControllerBase
{
    private readonly PawrtalDbContext _db;

    public InventoryController(PawrtalDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// GET /api/inventory
    /// List clinical supplies with optional filters for type, search, status, and sorting.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<InventoryItemDto>>> List(
        [FromQuery] string? type,
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] string? order,
        [FromQuery] int limit = 200)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var thirtyDaysOut = today.AddDays(30);

        IQueryable<InventoryItem> q = _db.InventoryItems
            .AsNoTracking()
            .Where(i => !i.IsDeleted);

        // Filter by item type (Vaccine / Medication)
        if (!string.IsNullOrWhiteSpace(type) && !type.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            q = q.Where(i => i.ItemType.ToLower() == type.Trim().ToLower());
        }

        // Search across name, SKU, batch number, manufacturer, or category
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            q = q.Where(i =>
                (i.Name != null && i.Name.ToLower().Contains(s)) ||
                (i.Sku != null && i.Sku.ToLower().Contains(s)) ||
                (i.BatchNumber != null && i.BatchNumber.ToLower().Contains(s)) ||
                (i.Manufacturer != null && i.Manufacturer.ToLower().Contains(s)) ||
                (i.Category != null && i.Category.ToLower().Contains(s)));
        }

        // Status filters
        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            var st = status.Trim().ToLower();
            switch (st)
            {
                case "low_stock":
                    q = q.Where(i => i.Quantity > 0 && i.Quantity <= i.MinStockLevel);
                    break;
                case "out_of_stock":
                    q = q.Where(i => i.Quantity <= 0);
                    break;
                case "expired":
                    q = q.Where(i => i.ExpirationDate.HasValue && i.ExpirationDate.Value < today);
                    break;
                case "expiring_soon":
                    q = q.Where(i => i.ExpirationDate.HasValue && i.ExpirationDate.Value >= today && i.ExpirationDate.Value <= thirtyDaysOut);
                    break;
                case "in_stock":
                    q = q.Where(i => i.Quantity > i.MinStockLevel && (!i.ExpirationDate.HasValue || i.ExpirationDate.Value >= today));
                    break;
            }
        }

        // Ordering
        q = order switch
        {
            "-created_date" => q.OrderByDescending(i => i.CreatedAt),
            "created_date" => q.OrderBy(i => i.CreatedAt),
            "name" => q.OrderBy(i => i.Name),
            "-name" => q.OrderByDescending(i => i.Name),
            "quantity" => q.OrderBy(i => i.Quantity),
            "-quantity" => q.OrderByDescending(i => i.Quantity),
            "expiry" => q.OrderBy(i => i.ExpirationDate),
            "-expiry" => q.OrderByDescending(i => i.ExpirationDate),
            _ => q.OrderBy(i => i.ItemType).ThenBy(i => i.Name)
        };

        var items = await q.Take(Math.Clamp(limit, 1, 500)).ToListAsync();
        return Ok(items.Select(i => ToDto(i, today)).ToList());
    }

    /// <summary>
    /// GET /api/inventory/{id}
    /// Lookup a single supply item.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<InventoryItemDto>> GetById([FromRoute] Guid id)
    {
        var item = await _db.InventoryItems
            .AsNoTracking()
            .FirstOrDefaultAsync(i => i.Id == id && !i.IsDeleted);

        if (item is null) return NotFound(new { error = "Inventory item not found." });

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        return Ok(ToDto(item, today));
    }

    /// <summary>
    /// POST /api/inventory
    /// Create a new supply item (Vaccine or Medication).
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<InventoryItemDto>> Create([FromBody] InventoryItemUpsertRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { error = "Name is required." });

        var itemType = string.IsNullOrWhiteSpace(request.ItemType)
            ? "Medication"
            : request.ItemType.Trim();

        if (!itemType.Equals("Vaccine", StringComparison.OrdinalIgnoreCase) &&
            !itemType.Equals("Medication", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { error = "item_type must be 'Vaccine' or 'Medication'." });
        }

        DateOnly? expiry = null;
        if (!string.IsNullOrWhiteSpace(request.ExpirationDate) &&
            DateOnly.TryParse(request.ExpirationDate.Trim(), out var parsedExpiry))
        {
            expiry = parsedExpiry;
        }

        string? sku = null;
        if (!string.IsNullOrWhiteSpace(request.Sku))
        {
            var trimmedSku = request.Sku.Trim();
            if (trimmedSku.Contains(' ') || !System.Text.RegularExpressions.Regex.IsMatch(trimmedSku, @"^[A-Z0-9]+(-[A-Z0-9]+)*$", System.Text.RegularExpressions.RegexOptions.IgnoreCase))
            {
                return BadRequest(new { error = "Invalid SKU / Barcode ID format. Only alphanumeric characters and optional hyphens are allowed (no spaces)." });
            }
            sku = trimmedSku.ToUpperInvariant();
        }

        string? batchNumber = null;
        if (!string.IsNullOrWhiteSpace(request.BatchNumber))
        {
            var trimmedBatch = request.BatchNumber.Trim();
            if (trimmedBatch.Contains(' ') || !System.Text.RegularExpressions.Regex.IsMatch(trimmedBatch, @"^[A-Z0-9]+(-[A-Z0-9]+)*$", System.Text.RegularExpressions.RegexOptions.IgnoreCase))
            {
                return BadRequest(new { error = "Invalid Batch / Lot Number format. Only alphanumeric characters and optional hyphens are allowed (no spaces)." });
            }
            batchNumber = trimmedBatch.ToUpperInvariant();
        }

        var item = new InventoryItem
        {
            Id = Guid.NewGuid(),
            ItemType = char.ToUpper(itemType[0]) + itemType.Substring(1).ToLower(),
            Name = request.Name.Trim(),
            Category = string.IsNullOrWhiteSpace(request.Category) ? null : request.Category.Trim(),
            Sku = sku,
            BatchNumber = batchNumber,
            Quantity = Math.Max(0, request.Quantity ?? 0),
            Unit = string.IsNullOrWhiteSpace(request.Unit) ? "units" : request.Unit.Trim(),
            MinStockLevel = Math.Max(0, request.MinStockLevel ?? 5),
            UnitPrice = request.UnitPrice,
            ExpirationDate = expiry,
            Manufacturer = string.IsNullOrWhiteSpace(request.Manufacturer) ? null : request.Manufacturer.Trim(),
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim(),
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = null
        };

        _db.InventoryItems.Add(item);
        await _db.SaveChangesAsync();

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        return CreatedAtAction(nameof(GetById), new { id = item.Id }, ToDto(item, today));
    }

    /// <summary>
    /// PUT /api/inventory/{id}
    /// Update an existing supply item.
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<InventoryItemDto>> Update([FromRoute] Guid id, [FromBody] InventoryItemUpsertRequest request)
    {
        var item = await _db.InventoryItems.FirstOrDefaultAsync(i => i.Id == id && !i.IsDeleted);
        if (item is null) return NotFound(new { error = "Inventory item not found." });

        if (!string.IsNullOrWhiteSpace(request.Name))
            item.Name = request.Name.Trim();

        if (!string.IsNullOrWhiteSpace(request.ItemType))
        {
            var t = request.ItemType.Trim();
            if (t.Equals("Vaccine", StringComparison.OrdinalIgnoreCase) ||
                t.Equals("Medication", StringComparison.OrdinalIgnoreCase))
            {
                item.ItemType = char.ToUpper(t[0]) + t.Substring(1).ToLower();
            }
        }

        if (request.Category is not null) item.Category = string.IsNullOrWhiteSpace(request.Category) ? null : request.Category.Trim();

        if (request.Sku is not null)
        {
            var trimmedSku = request.Sku.Trim();
            if (!string.IsNullOrWhiteSpace(trimmedSku))
            {
                if (trimmedSku.Contains(' ') || !System.Text.RegularExpressions.Regex.IsMatch(trimmedSku, @"^[A-Z0-9]+(-[A-Z0-9]+)*$", System.Text.RegularExpressions.RegexOptions.IgnoreCase))
                {
                    return BadRequest(new { error = "Invalid SKU / Barcode ID format. Only alphanumeric characters and optional hyphens are allowed (no spaces)." });
                }
                item.Sku = trimmedSku.ToUpperInvariant();
            }
            else
            {
                item.Sku = null;
            }
        }

        if (request.BatchNumber is not null)
        {
            var trimmedBatch = request.BatchNumber.Trim();
            if (!string.IsNullOrWhiteSpace(trimmedBatch))
            {
                if (trimmedBatch.Contains(' ') || !System.Text.RegularExpressions.Regex.IsMatch(trimmedBatch, @"^[A-Z0-9]+(-[A-Z0-9]+)*$", System.Text.RegularExpressions.RegexOptions.IgnoreCase))
                {
                    return BadRequest(new { error = "Invalid Batch / Lot Number format. Only alphanumeric characters and optional hyphens are allowed (no spaces)." });
                }
                item.BatchNumber = trimmedBatch.ToUpperInvariant();
            }
            else
            {
                item.BatchNumber = null;
            }
        }

        if (request.Quantity.HasValue) item.Quantity = Math.Max(0, request.Quantity.Value);
        if (request.Unit is not null) item.Unit = string.IsNullOrWhiteSpace(request.Unit) ? "units" : request.Unit.Trim();
        if (request.MinStockLevel.HasValue) item.MinStockLevel = Math.Max(0, request.MinStockLevel.Value);
        if (request.UnitPrice.HasValue) item.UnitPrice = request.UnitPrice.Value;
        if (request.Manufacturer is not null) item.Manufacturer = string.IsNullOrWhiteSpace(request.Manufacturer) ? null : request.Manufacturer.Trim();
        if (request.Notes is not null) item.Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();

        if (!string.IsNullOrWhiteSpace(request.ExpirationDate))
        {
            if (DateOnly.TryParse(request.ExpirationDate.Trim(), out var parsedExpiry))
                item.ExpirationDate = parsedExpiry;
        }
        else if (request.ExpirationDate == string.Empty)
        {
            item.ExpirationDate = null;
        }

        item.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        return Ok(ToDto(item, today));
    }

    /// <summary>
    /// PATCH /api/inventory/{id}/stock
    /// Quick stock adjustment (add received stock, subtract dispensed stock, or set count).
    /// </summary>
    [HttpPatch("{id:guid}/stock")]
    public async Task<ActionResult<InventoryItemDto>> AdjustStock([FromRoute] Guid id, [FromBody] InventoryStockAdjustRequest request)
    {
        var item = await _db.InventoryItems.FirstOrDefaultAsync(i => i.Id == id && !i.IsDeleted);
        if (item is null) return NotFound(new { error = "Inventory item not found." });

        var mode = (request.Mode ?? "add").Trim().ToLower();
        switch (mode)
        {
            case "add":
            case "receive":
                item.Quantity = Math.Max(0, item.Quantity + Math.Abs(request.Amount));
                break;
            case "subtract":
            case "dispense":
            case "use":
                item.Quantity = Math.Max(0, item.Quantity - Math.Abs(request.Amount));
                break;
            case "set":
                item.Quantity = Math.Max(0, request.Amount);
                break;
            default:
                return BadRequest(new { error = "mode must be 'add', 'subtract', or 'set'." });
        }

        item.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        return Ok(ToDto(item, today));
    }

    /// <summary>
    /// DELETE /api/inventory/{id}
    /// Soft delete an inventory supply item.
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete([FromRoute] Guid id)
    {
        var item = await _db.InventoryItems.FirstOrDefaultAsync(i => i.Id == id && !i.IsDeleted);
        if (item is null) return NotFound(new { error = "Inventory item not found." });

        item.IsDeleted = true;
        item.DeletedAt = DateTime.UtcNow;
        item.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return NoContent();
    }

    private static InventoryItemDto ToDto(InventoryItem i, DateOnly today)
    {
        var isExpired = i.ExpirationDate.HasValue && i.ExpirationDate.Value < today;
        var isExpiringSoon = i.ExpirationDate.HasValue &&
                             i.ExpirationDate.Value >= today &&
                             i.ExpirationDate.Value <= today.AddDays(30);

        var isOutOfStock = i.Quantity <= 0;
        var isLowStock = !isOutOfStock && i.Quantity <= i.MinStockLevel;

        return new InventoryItemDto
        {
            Id = i.Id.ToString(),
            ItemType = i.ItemType,
            Name = i.Name,
            Category = i.Category,
            Sku = i.Sku,
            BatchNumber = i.BatchNumber,
            Quantity = i.Quantity,
            Unit = i.Unit,
            MinStockLevel = i.MinStockLevel,
            UnitPrice = i.UnitPrice,
            ExpirationDate = i.ExpirationDate?.ToString("yyyy-MM-dd"),
            Manufacturer = i.Manufacturer,
            Notes = i.Notes,
            IsLowStock = isLowStock,
            IsOutOfStock = isOutOfStock,
            IsExpired = isExpired,
            IsExpiringSoon = isExpiringSoon,
            CreatedAt = i.CreatedAt,
            UpdatedAt = i.UpdatedAt
        };
    }
}
