using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using PawrtalWeb.Models;

namespace PawrtalWeb.Shared;

public static class DbInitializer
{
    public static async Task InitializeAsync(PawrtalDbContext db)
    {
        // 1. Ensure InventoryItems table exists
        const string createTableSql = @"
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'InventoryItems')
BEGIN
    CREATE TABLE InventoryItems (
        Id UNIQUEIDENTIFIER PRIMARY KEY,
        ItemType NVARCHAR(50) NOT NULL,
        Name NVARCHAR(200) NOT NULL,
        Category NVARCHAR(100) NULL,
        Sku NVARCHAR(100) NULL,
        BatchNumber NVARCHAR(100) NULL,
        Quantity INT NOT NULL DEFAULT 0,
        Unit NVARCHAR(50) NULL,
        MinStockLevel INT NOT NULL DEFAULT 5,
        UnitPrice DECIMAL(18, 2) NULL,
        ExpirationDate DATE NULL,
        Manufacturer NVARCHAR(200) NULL,
        Notes NVARCHAR(MAX) NULL,
        IsDeleted BIT NOT NULL DEFAULT 0,
        DeletedAt DATETIME2 NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NULL
    );
END

-- Ensure StorageLocation is removed if it previously existed
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('InventoryItems') AND name = 'StorageLocation')
BEGIN
    ALTER TABLE InventoryItems DROP COLUMN StorageLocation;
END

-- Ensure Users table has DisplayName, FirstName, MiddleName, LastName columns
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'DisplayName')
BEGIN
    ALTER TABLE Users ADD DisplayName NVARCHAR(100) NULL;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'FirstName')
BEGIN
    ALTER TABLE Users ADD FirstName NVARCHAR(100) NULL;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'MiddleName')
BEGIN
    ALTER TABLE Users ADD MiddleName NVARCHAR(100) NULL;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'LastName')
BEGIN
    ALTER TABLE Users ADD LastName NVARCHAR(100) NULL;
END

";
        await db.Database.ExecuteSqlRawAsync(createTableSql);

        // Backfill existing rows from FullName using dynamic SQL (deferred compilation after columns exist)
        const string backfillSql = @"
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'FullName')
BEGIN
    EXEC(N'
        UPDATE Users
        SET FirstName = CASE 
                WHEN FirstName IS NOT NULL AND LEN(LTRIM(FirstName)) > 0 THEN FirstName
                WHEN CHARINDEX('' '', LTRIM(FullName)) > 0 
                THEN SUBSTRING(LTRIM(FullName), 1, CHARINDEX('' '', LTRIM(FullName)) - 1)
                ELSE LTRIM(FullName) 
            END,
            LastName = CASE 
                WHEN LastName IS NOT NULL AND LEN(LTRIM(LastName)) > 0 THEN LastName
                WHEN CHARINDEX('' '', LTRIM(FullName)) > 0 
                THEN SUBSTRING(LTRIM(FullName), CHARINDEX('' '', LTRIM(FullName)) + 1, LEN(FullName))
                ELSE '''' 
            END,
            DisplayName = CASE
                WHEN DisplayName IS NOT NULL AND LEN(LTRIM(DisplayName)) > 0 THEN DisplayName
                ELSE FullName
            END
        WHERE FullName IS NOT NULL;

        ALTER TABLE Users DROP COLUMN FullName;
    ');
END
";
        await db.Database.ExecuteSqlRawAsync(backfillSql);

        // 2. Seed starter vaccines & medications if table is empty
        var hasItems = await db.InventoryItems.AnyAsync();
        if (!hasItems)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            var starterSupplies = new List<InventoryItem>
            {
                // Vaccines
                new()
                {
                    Id = Guid.NewGuid(),
                    ItemType = "Vaccine",
                    Name = "Rabies Vaccine (Defensor 3)",
                    Category = "Rabies",
                    Sku = "VAC-RAB-001",
                    BatchNumber = "RB-2026-09A",
                    Quantity = 45,
                    Unit = "vials",
                    MinStockLevel = 10,
                    UnitPrice = 350.00m,
                    ExpirationDate = today.AddMonths(14),
                    Manufacturer = "Zoetis",
                    Notes = "Store at 2°C to 8°C. Protect from light. Administer subcutaneously.",
                    CreatedAt = DateTime.UtcNow
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    ItemType = "Vaccine",
                    Name = "DHPP 5-in-1 Vaccine (Nobivac)",
                    Category = "Canine Multivalent",
                    Sku = "VAC-DHPP-002",
                    BatchNumber = "DH-4491-B",
                    Quantity = 32,
                    Unit = "doses",
                    MinStockLevel = 8,
                    UnitPrice = 480.00m,
                    ExpirationDate = today.AddMonths(10),
                    Manufacturer = "Boehringer Ingelheim",
                    Notes = "Distemper, Hepatitis, Parvovirus, Parainfluenza combination.",
                    CreatedAt = DateTime.UtcNow
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    ItemType = "Vaccine",
                    Name = "Bordetella Bronchiseptica (Canine Cough)",
                    Category = "Non-Core Vaccine",
                    Sku = "VAC-BOR-003",
                    BatchNumber = "BB-8820-C",
                    Quantity = 6, // triggers low stock warning!
                    Unit = "doses",
                    MinStockLevel = 8,
                    UnitPrice = 420.00m,
                    ExpirationDate = today.AddMonths(8),
                    Manufacturer = "Merck Animal Health",
                    Notes = "Oral or intranasal vaccine for canine infectious respiratory disease.",
                    CreatedAt = DateTime.UtcNow
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    ItemType = "Vaccine",
                    Name = "FVRCP Core Feline 3-in-1 (Felocell 3)",
                    Category = "Feline Multivalent",
                    Sku = "VAC-FVR-004",
                    BatchNumber = "FV-1102-K",
                    Quantity = 25,
                    Unit = "doses",
                    MinStockLevel = 6,
                    UnitPrice = 450.00m,
                    ExpirationDate = today.AddMonths(12),
                    Manufacturer = "Zoetis",
                    Notes = "Feline Viral Rhinotracheitis, Calicivirus, Panleukopenia.",
                    CreatedAt = DateTime.UtcNow
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    ItemType = "Vaccine",
                    Name = "FeLV Feline Leukemia Vaccine",
                    Category = "Non-Core Vaccine",
                    Sku = "VAC-FELV-005",
                    BatchNumber = "FL-9021-M",
                    Quantity = 12,
                    Unit = "vials",
                    MinStockLevel = 5,
                    UnitPrice = 520.00m,
                    ExpirationDate = today.AddMonths(11),
                    Manufacturer = "Elanco",
                    Notes = "For outdoor or at-risk cats. Pre-test for FeLV antigen recommended.",
                    CreatedAt = DateTime.UtcNow
                },

                // Medications
                new()
                {
                    Id = Guid.NewGuid(),
                    ItemType = "Medication",
                    Name = "Clavamox 62.5mg",
                    Category = "Antibiotic",
                    Sku = "MED-CLAV-010",
                    BatchNumber = "CL-7721-P",
                    Quantity = 120,
                    Unit = "tablets",
                    MinStockLevel = 30,
                    UnitPrice = 45.00m,
                    ExpirationDate = today.AddMonths(18),
                    Manufacturer = "Zoetis",
                    Notes = "Amoxicillin and clavulanate potassium broad-spectrum antibacterial.",
                    CreatedAt = DateTime.UtcNow
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    ItemType = "Medication",
                    Name = "Metacam Oral Suspension 1.5mg/mL",
                    Category = "NSAID / Pain Relief",
                    Sku = "MED-META-011",
                    BatchNumber = "MC-3329-D",
                    Quantity = 3, // triggers low stock warning!
                    Unit = "bottles",
                    MinStockLevel = 5,
                    UnitPrice = 850.00m,
                    ExpirationDate = today.AddMonths(15),
                    Manufacturer = "Boehringer Ingelheim",
                    Notes = "Non-steroidal anti-inflammatory for osteoarthritis and acute pain in dogs.",
                    CreatedAt = DateTime.UtcNow
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    ItemType = "Medication",
                    Name = "NexGard Spectra (15-30kg)",
                    Category = "Antiparasitic",
                    Sku = "MED-NEX-012",
                    BatchNumber = "NX-8841-L",
                    Quantity = 38,
                    Unit = "chewables",
                    MinStockLevel = 10,
                    UnitPrice = 650.00m,
                    ExpirationDate = today.AddMonths(20),
                    Manufacturer = "Boehringer Ingelheim",
                    Notes = "Monthly chewable against fleas, ticks, heartworm, and intestinal worms.",
                    CreatedAt = DateTime.UtcNow
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    ItemType = "Medication",
                    Name = "Prednisone 5mg",
                    Category = "Corticosteroid",
                    Sku = "MED-PRED-013",
                    BatchNumber = "PR-1044-T",
                    Quantity = 180,
                    Unit = "tablets",
                    MinStockLevel = 40,
                    UnitPrice = 15.00m,
                    ExpirationDate = today.AddMonths(22),
                    Manufacturer = "MedVet Labs",
                    Notes = "Glucocorticoid for allergy management and immune-mediated conditions.",
                    CreatedAt = DateTime.UtcNow
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    ItemType = "Medication",
                    Name = "Cephalexin 250mg",
                    Category = "Antibiotic",
                    Sku = "MED-CEPH-014",
                    BatchNumber = "CP-5520-X",
                    Quantity = 85,
                    Unit = "capsules",
                    MinStockLevel = 25,
                    UnitPrice = 32.00m,
                    ExpirationDate = today.AddMonths(16),
                    Manufacturer = "Teva Animal Health",
                    Notes = "First-generation cephalosporin for pyoderma and soft tissue infections.",
                    CreatedAt = DateTime.UtcNow
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    ItemType = "Medication",
                    Name = "Gabapentin 100mg",
                    Category = "Sedative / Anxiety",
                    Sku = "MED-GABA-015",
                    BatchNumber = "GB-4490-W",
                    Quantity = 65,
                    Unit = "capsules",
                    MinStockLevel = 20,
                    UnitPrice = 28.00m,
                    ExpirationDate = today.AddMonths(17),
                    Manufacturer = "Aurobindo",
                    Notes = "Adjunctive therapy for chronic pain and pre-visit veterinary anxiety.",
                    CreatedAt = DateTime.UtcNow
                }
            };

            await db.InventoryItems.AddRangeAsync(starterSupplies);
            await db.SaveChangesAsync();
        }

        // 3. Ensure Default Veterinarian Dr. Rebecca Goyena exists
        const string rebeccaEmail = "rebeccagoyena@pawrtal.com";
        var rebeccaUser = await db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == rebeccaEmail);
        if (rebeccaUser == null)
        {
            var rebecca = new User
            {
                Id = Guid.NewGuid(),
                Email = "RebeccaGoyena@pawrtal.com",
                DisplayName = "Dr. Rebecca Goyena",
                FirstName = "Rebecca",
                LastName = "Goyena",
                UserType = "veterinarian",
                Phone = "09171234567",
                Address = "VM Veterinary Clinic",
                LicenseNumber = "PRC-0078901",
                Specialization = "General Veterinary Medicine & Surgery",
                PasswordHash = Utilities.Encrypt("RebeccaGoyena01"),
                NotificationPrefsJson = System.Text.Json.JsonSerializer.Serialize(new
                {
                    email = true,
                    sms = true,
                    appointments = true,
                    vaccinations = true,
                    medications = true,
                    display_name = "Dr. Rebecca Goyena",
                    first_name = "Rebecca",
                    last_name = "Goyena",
                    phone = "09171234567",
                    legal_name = "Rebecca Goyena"
                }),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsDeleted = false
            };
            await db.Users.AddAsync(rebecca);
            await db.SaveChangesAsync();
        }
        else
        {
            bool modified = false;
            if (string.IsNullOrWhiteSpace(rebeccaUser.DisplayName) || rebeccaUser.DisplayName.Trim().Equals("Dr. Goyena", StringComparison.OrdinalIgnoreCase))
            {
                rebeccaUser.DisplayName = "Dr. Rebecca Goyena";
                modified = true;
            }
            if (string.IsNullOrWhiteSpace(rebeccaUser.FirstName) || rebeccaUser.FirstName.Trim().Equals("Dr.", StringComparison.OrdinalIgnoreCase) || rebeccaUser.FirstName.Trim().Equals("Dr", StringComparison.OrdinalIgnoreCase))
            {
                rebeccaUser.FirstName = "Rebecca";
                modified = true;
            }
            if (string.IsNullOrWhiteSpace(rebeccaUser.LastName))
            {
                rebeccaUser.LastName = "Goyena";
                modified = true;
            }
            if (rebeccaUser.UserType != "veterinarian")
            {
                rebeccaUser.UserType = "veterinarian";
                modified = true;
            }
            if (string.IsNullOrWhiteSpace(rebeccaUser.Specialization))
            {
                rebeccaUser.Specialization = "General Veterinary Medicine & Surgery";
                modified = true;
            }
            if (modified)
            {
                rebeccaUser.UpdatedAt = DateTime.UtcNow;
                await db.SaveChangesAsync();
            }
        }

        // Clean up any other users who had 'Dr.' or 'Dr' accidentally assigned as their FirstName
        var vetsWithDrFirst = await db.Users.Where(u => u.FirstName == "Dr." || u.FirstName == "Dr").ToListAsync();
        foreach (var v in vetsWithDrFirst)
        {
            if (!string.IsNullOrWhiteSpace(v.DisplayName))
            {
                var clean = System.Text.RegularExpressions.Regex.Replace(v.DisplayName.Trim(), @"^dr\.?\s+", "", System.Text.RegularExpressions.RegexOptions.IgnoreCase).Trim();
                var parts = clean.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length > 0)
                {
                    v.FirstName = parts[0];
                    if (parts.Length > 1 && string.IsNullOrWhiteSpace(v.LastName))
                    {
                        v.LastName = parts[1];
                    }
                }
            }
            v.UpdatedAt = DateTime.UtcNow;
        }
        if (vetsWithDrFirst.Count > 0)
        {
            await db.SaveChangesAsync();
        }
    }
}
