-- ======================================================================================
-- PAWRTAL VETERINARY CLINIC MANAGEMENT SYSTEM
-- Master Database Creation & Fresh Start Script
-- Includes: Complete Tables, Primary Keys, Foreign Keys, Indexes, Constraints,
--           and Clean Initial Seed (Admin Staff & Clinical Supplies Inventory)
-- ======================================================================================

-- 1. Create Database if it does not already exist
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'PawrtalDB')
BEGIN
    CREATE DATABASE [PawrtalDB];
    PRINT 'Database [PawrtalDB] created successfully.';
END
ELSE
BEGIN
    PRINT 'Database [PawrtalDB] already exists. Preparing schema...';
END
GO

USE [PawrtalDB];
GO

-- ======================================================================================
-- 2. Drop Foreign Keys (if recreating over existing tables)
-- ======================================================================================
IF OBJECT_ID(N'FK_Appointments_Pets_PetId', 'F') IS NOT NULL ALTER TABLE [Appointments] DROP CONSTRAINT FK_Appointments_Pets_PetId;
IF OBJECT_ID(N'FK_HealthRecords_Pets_PetId', 'F') IS NOT NULL ALTER TABLE [HealthRecords] DROP CONSTRAINT FK_HealthRecords_Pets_PetId;
IF OBJECT_ID(N'FK_Vaccinations_Pets_PetId', 'F') IS NOT NULL ALTER TABLE [Vaccinations] DROP CONSTRAINT FK_Vaccinations_Pets_PetId;
IF OBJECT_ID(N'FK_Medications_Pets_PetId', 'F') IS NOT NULL ALTER TABLE [Medications] DROP CONSTRAINT FK_Medications_Pets_PetId;
IF OBJECT_ID(N'FK_JournalEntries_Pets_PetId', 'F') IS NOT NULL ALTER TABLE [JournalEntries] DROP CONSTRAINT FK_JournalEntries_Pets_PetId;
IF OBJECT_ID(N'FK_GroomingRecords_Pet', 'F') IS NOT NULL ALTER TABLE [GroomingRecords] DROP CONSTRAINT FK_GroomingRecords_Pet;
IF OBJECT_ID(N'FK_PetAllergies_Pets_PetId', 'F') IS NOT NULL ALTER TABLE [PetAllergies] DROP CONSTRAINT FK_PetAllergies_Pets_PetId;
IF OBJECT_ID(N'FK_PetMedicalConditions_Pets_PetId', 'F') IS NOT NULL ALTER TABLE [PetMedicalConditions] DROP CONSTRAINT FK_PetMedicalConditions_Pets_PetId;
GO

-- ======================================================================================
-- 3. Drop Existing Tables in Dependency Order
-- ======================================================================================
IF OBJECT_ID(N'[Appointments]', 'U') IS NOT NULL DROP TABLE [Appointments];
IF OBJECT_ID(N'[HealthRecords]', 'U') IS NOT NULL DROP TABLE [HealthRecords];
IF OBJECT_ID(N'[Vaccinations]', 'U') IS NOT NULL DROP TABLE [Vaccinations];
IF OBJECT_ID(N'[Medications]', 'U') IS NOT NULL DROP TABLE [Medications];
IF OBJECT_ID(N'[JournalEntries]', 'U') IS NOT NULL DROP TABLE [JournalEntries];
IF OBJECT_ID(N'[GroomingRecords]', 'U') IS NOT NULL DROP TABLE [GroomingRecords];
IF OBJECT_ID(N'[PetAllergies]', 'U') IS NOT NULL DROP TABLE [PetAllergies];
IF OBJECT_ID(N'[PetMedicalConditions]', 'U') IS NOT NULL DROP TABLE [PetMedicalConditions];
IF OBJECT_ID(N'[Pets]', 'U') IS NOT NULL DROP TABLE [Pets];
IF OBJECT_ID(N'[Messages]', 'U') IS NOT NULL DROP TABLE [Messages];
IF OBJECT_ID(N'[Notifications]', 'U') IS NOT NULL DROP TABLE [Notifications];
IF OBJECT_ID(N'[InventoryItems]', 'U') IS NOT NULL DROP TABLE [InventoryItems];
IF OBJECT_ID(N'[Users]', 'U') IS NOT NULL DROP TABLE [Users];
IF OBJECT_ID(N'[__EFMigrationsHistory]', 'U') IS NOT NULL DROP TABLE [__EFMigrationsHistory];
GO

-- ======================================================================================
-- 4. Create Tables
-- ======================================================================================

-- 4.1 Users
CREATE TABLE [Users] (
    [Id]                   UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    [Email]                NVARCHAR(320)    NOT NULL,
    [DisplayName]          NVARCHAR(100)    NULL,
    [FirstName]            NVARCHAR(100)    NULL,
    [MiddleName]           NVARCHAR(100)    NULL,
    [LastName]             NVARCHAR(100)    NULL,
    [UserType]             NVARCHAR(50)     NULL,
    [Phone]                NVARCHAR(50)     NULL,
    [Address]              NVARCHAR(500)    NULL,
    [AvatarUrl]            NVARCHAR(2000)   NULL,
    [NotificationPrefsJson] NVARCHAR(MAX)   NULL,
    [CreatedAt]            DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [UpdatedAt]            DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [LicenseNumber]        NVARCHAR(100)    NULL,
    [Specialization]       NVARCHAR(200)    NULL,
    [PasswordHash]         NVARCHAR(200)    NULL,
    [IsDeleted]            BIT              NOT NULL DEFAULT 0,
    [DeletedAt]            DATETIME2        NULL,
    CONSTRAINT [CK_Users_UserType] CHECK ([UserType] IS NULL OR [UserType] IN ('admin', 'clinic_admin', 'veterinarian', 'pet_owner'))
);
CREATE UNIQUE NONCLUSTERED INDEX [UQ_Users_Email] ON [Users] ([Email]) WHERE [IsDeleted] = 0;
GO

-- 4.2 Pets
CREATE TABLE [Pets] (
    [Id]          UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    [OwnerEmail]  NVARCHAR(320)    NULL,
    [Name]        NVARCHAR(200)    NOT NULL,
    [Species]     NVARCHAR(50)     NOT NULL,
    [Breed]       NVARCHAR(200)    NULL,
    [DateOfBirth] DATE             NULL,
    [Gender]      NVARCHAR(50)     NULL,
    [WeightKg]    DECIMAL(6, 2)    NULL,
    [Color]       NVARCHAR(200)    NULL,
    [MicrochipId] NVARCHAR(100)    NULL,
    [PhotoUrl]    NVARCHAR(2000)   NULL,
    [IsNeutered]  BIT              NOT NULL DEFAULT 0,
    [CreatedAt]   DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [UpdatedAt]   DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [IsDeleted]   BIT              NOT NULL DEFAULT 0,
    [DeletedAt]   DATETIME2        NULL,
    CONSTRAINT [CK_Pets_Gender] CHECK ([Gender] IS NULL OR [Gender] IN ('male', 'female', 'unknown')),
    CONSTRAINT [CK_Pets_Species] CHECK ([Species] IN ('dog', 'cat', 'bird', 'rabbit', 'hamster', 'fish', 'reptile', 'other', 'Dog', 'Cat', 'Bird', 'Rabbit', 'Hamster', 'Fish', 'Reptile', 'Other'))
);
CREATE NONCLUSTERED INDEX [IX_Pets_OwnerEmail] ON [Pets] ([OwnerEmail]);
GO

-- 4.3 Appointments
CREATE TABLE [Appointments] (
    [Id]                 UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    [PetId]              UNIQUEIDENTIFIER NOT NULL,
    [OwnerEmail]         NVARCHAR(320)    NULL,
    [VetEmail]           NVARCHAR(320)    NULL,
    [Type]               NVARCHAR(50)     NOT NULL,
    [Date]               DATE             NOT NULL,
    [TimeSlot]           NVARCHAR(20)     NOT NULL,
    [Reason]             NVARCHAR(MAX)    NULL,
    [CancellationReason] NVARCHAR(MAX)    NULL,
    [Status]             NVARCHAR(50)     NOT NULL DEFAULT 'pending',
    [CreatedAt]          DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [UpdatedAt]          DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [IsDeleted]          BIT              NOT NULL DEFAULT 0,
    [DeletedAt]          DATETIME2        NULL,
    CONSTRAINT [FK_Appointments_Pets_PetId] FOREIGN KEY ([PetId]) REFERENCES [Pets]([Id]) ON DELETE CASCADE,
    CONSTRAINT [CK_Appointments_Status] CHECK ([Status] IN ('pending', 'confirmed', 'accepted', 'completed', 'cancelled', 'expired')),
    CONSTRAINT [CK_Appointments_Type] CHECK ([Type] IN ('checkup', 'general_checkup', 'General Checkup', 'vaccination', 'grooming', 'dental', 'follow_up', 'consultation', 'surgery', 'emergency', 'examination', 'other'))
);
-- Unique index: Prevents double-booking for the same vet, date, and timeslot
CREATE UNIQUE NONCLUSTERED INDEX [UQ_Appointments_Vet_Date_Slot]
ON [Appointments] ([VetEmail], [Date], [TimeSlot])
WHERE [IsDeleted] = 0 
  AND [Status] IN ('pending', 'confirmed', 'accepted') 
  AND [VetEmail] IS NOT NULL;
GO

-- 4.4 HealthRecords
CREATE TABLE [HealthRecords] (
    [Id]              UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    [PetId]           UNIQUEIDENTIFIER NOT NULL,
    [RecordType]      NVARCHAR(50)     NOT NULL,
    [Title]           NVARCHAR(200)    NOT NULL,
    [Description]     NVARCHAR(MAX)    NULL,
    [Date]            DATE             NOT NULL,
    [FileUrl]         NVARCHAR(2000)   NULL,
    [IsVisibleToOwner] BIT             NOT NULL DEFAULT 1,
    [VetEmail]        NVARCHAR(320)    NULL,
    [VetName]         NVARCHAR(200)    NULL,
    [Diagnosis]       NVARCHAR(MAX)    NULL,
    [Treatment]       NVARCHAR(MAX)    NULL,
    [WeightKg]        DECIMAL(6, 2)    NULL,
    [TemperatureC]    DECIMAL(4, 1)    NULL,
    [HeartRateBpm]    INT              NULL,
    [NextDueDate]     DATE             NULL,
    [CreatedAt]       DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [IsDeleted]       BIT              NOT NULL DEFAULT 0,
    [DeletedAt]       DATETIME2        NULL,
    CONSTRAINT [FK_HealthRecords_Pets_PetId] FOREIGN KEY ([PetId]) REFERENCES [Pets]([Id]) ON DELETE CASCADE,
    CONSTRAINT [CK_HealthRecords_RecordType] CHECK ([RecordType] IN ('examination', 'vaccination', 'medication', 'surgery', 'grooming', 'other', 'prescription', 'lab_result', 'treatment', 'diagnosis'))
);
CREATE NONCLUSTERED INDEX [IX_HealthRecords_PetId] ON [HealthRecords] ([PetId]);
GO

-- 4.5 Vaccinations
CREATE TABLE [Vaccinations] (
    [Id]               UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    [PetId]            UNIQUEIDENTIFIER NOT NULL,
    [VaccineName]      NVARCHAR(200)    NOT NULL,
    [DateAdministered] DATE             NOT NULL,
    [NextDueDate]      DATE             NULL,
    [BatchNumber]      NVARCHAR(100)    NULL,
    [Notes]            NVARCHAR(MAX)    NULL,
    [AdministeredBy]   NVARCHAR(200)    NULL,
    [CreatedAt]        DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [IsDeleted]        BIT              NOT NULL DEFAULT 0,
    [DeletedAt]        DATETIME2        NULL,
    CONSTRAINT [FK_Vaccinations_Pets_PetId] FOREIGN KEY ([PetId]) REFERENCES [Pets]([Id]) ON DELETE CASCADE
);
CREATE NONCLUSTERED INDEX [IX_Vaccinations_PetId] ON [Vaccinations] ([PetId]);
GO

-- 4.6 Medications
CREATE TABLE [Medications] (
    [Id]           UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    [PetId]        UNIQUEIDENTIFIER NOT NULL,
    [Name]         NVARCHAR(200)    NOT NULL,
    [Dosage]       NVARCHAR(100)    NULL,
    [Frequency]    NVARCHAR(100)    NULL,
    [StartDate]    DATE             NOT NULL,
    [EndDate]      DATE             NULL,
    [Notes]        NVARCHAR(MAX)    NULL,
    [IsActive]     BIT              NOT NULL DEFAULT 1,
    [PrescribedBy] NVARCHAR(200)    NULL,
    [CreatedAt]    DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [IsDeleted]    BIT              NOT NULL DEFAULT 0,
    [DeletedAt]    DATETIME2        NULL,
    CONSTRAINT [FK_Medications_Pets_PetId] FOREIGN KEY ([PetId]) REFERENCES [Pets]([Id]) ON DELETE CASCADE
);
CREATE NONCLUSTERED INDEX [IX_Medications_PetId] ON [Medications] ([PetId]);
GO

-- 4.7 JournalEntries
CREATE TABLE [JournalEntries] (
    [Id]        UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    [PetId]     UNIQUEIDENTIFIER NOT NULL,
    [EntryType] NVARCHAR(50)     NOT NULL,
    [Mood]      NVARCHAR(50)     NULL,
    [Title]     NVARCHAR(200)    NOT NULL,
    [Content]   NVARCHAR(MAX)    NULL,
    [Date]      DATE             NOT NULL,
    [CreatedAt] DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [IsDeleted] BIT              NOT NULL DEFAULT 0,
    [DeletedAt] DATETIME2        NULL,
    CONSTRAINT [FK_JournalEntries_Pets_PetId] FOREIGN KEY ([PetId]) REFERENCES [Pets]([Id]) ON DELETE CASCADE,
    CONSTRAINT [CK_JournalEntries_EntryType] CHECK ([EntryType] IN ('feeding', 'grooming', 'exercise', 'behavior', 'symptom', 'weight', 'general', 'medical', 'other'))
);
CREATE NONCLUSTERED INDEX [IX_JournalEntries_PetId] ON [JournalEntries] ([PetId]);
GO

-- 4.8 GroomingRecords
CREATE TABLE [GroomingRecords] (
    [Id]                  UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    [PetId]               UNIQUEIDENTIFIER NOT NULL,
    [GroomingType]        NVARCHAR(100)    NOT NULL,
    [GroomerName]         NVARCHAR(200)    NULL,
    [Date]                DATE             NOT NULL,
    [CoatConditionBefore] NVARCHAR(100)    NULL,
    [CoatStyleNotes]      NVARCHAR(500)    NULL,
    [Observations]        NVARCHAR(MAX)    NULL,
    [IsVisibleToOwner]    BIT              NOT NULL DEFAULT 1,
    [CreatedAt]           DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [IsDeleted]           BIT              NOT NULL DEFAULT 0,
    [DeletedAt]           DATETIME2        NULL,
    CONSTRAINT [FK_GroomingRecords_Pet] FOREIGN KEY ([PetId]) REFERENCES [Pets]([Id]) ON DELETE CASCADE,
    CONSTRAINT [CK_GroomingRecords_GroomingType] CHECK ([GroomingType] IN ('full_groom', 'bath_and_dry', 'haircut_only', 'nail_trim', 'ear_cleaning', 'teeth_brushing', 'deshedding', 'flea_treatment', 'other', 'grooming'))
);
CREATE NONCLUSTERED INDEX [IX_GroomingRecords_PetId] ON [GroomingRecords] ([PetId]);
GO

-- 4.9 PetAllergies (Composite Primary Key)
CREATE TABLE [PetAllergies] (
    [PetId] UNIQUEIDENTIFIER NOT NULL,
    [Value] NVARCHAR(200)    NOT NULL,
    PRIMARY KEY CLUSTERED ([PetId] ASC, [Value] ASC),
    CONSTRAINT [FK_PetAllergies_Pets_PetId] FOREIGN KEY ([PetId]) REFERENCES [Pets]([Id]) ON DELETE CASCADE
);
GO

-- 4.10 PetMedicalConditions (Composite Primary Key)
CREATE TABLE [PetMedicalConditions] (
    [PetId] UNIQUEIDENTIFIER NOT NULL,
    [Value] NVARCHAR(200)    NOT NULL,
    PRIMARY KEY CLUSTERED ([PetId] ASC, [Value] ASC),
    CONSTRAINT [FK_PetMedicalConditions_Pets_PetId] FOREIGN KEY ([PetId]) REFERENCES [Pets]([Id]) ON DELETE CASCADE
);
GO

-- 4.11 Messages
CREATE TABLE [Messages] (
    [Id]            UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    [SenderEmail]   NVARCHAR(320)    NOT NULL,
    [ReceiverEmail] NVARCHAR(320)    NOT NULL,
    [Content]       NVARCHAR(MAX)    NOT NULL,
    [CreatedAt]     DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [IsRead]        BIT              NOT NULL DEFAULT 0,
    [IsDeleted]     BIT              NOT NULL DEFAULT 0,
    [DeletedAt]     DATETIME2        NULL
);
CREATE NONCLUSTERED INDEX [IX_Messages_Sender_Receiver] ON [Messages] ([SenderEmail], [ReceiverEmail]);
GO

-- 4.12 Notifications
CREATE TABLE [Notifications] (
    [Id]                UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    [UserEmail]         NVARCHAR(320)    NOT NULL,
    [Type]              NVARCHAR(50)     NOT NULL,
    [Title]             NVARCHAR(200)    NOT NULL,
    [Message]           NVARCHAR(MAX)    NOT NULL,
    [CreatedAt]         DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [IsRead]            BIT              NOT NULL DEFAULT 0,
    [RelatedEntityType] NVARCHAR(100)    NULL,
    [RelatedEntityId]   UNIQUEIDENTIFIER NULL,
    [IsDeleted]         BIT              NOT NULL DEFAULT 0,
    [DeletedAt]         DATETIME2        NULL,
    CONSTRAINT [CK_Notifications_Type] CHECK ([Type] IN ('appointment', 'grooming', 'health_record', 'medication', 'message', 'vaccination', 'general', 'system'))
);
CREATE NONCLUSTERED INDEX [IX_Notifications_UserEmail_IsRead] ON [Notifications] ([UserEmail], [IsRead]);
GO

-- 4.13 InventoryItems (Clinical Vaccines & Medications Catalog)
CREATE TABLE [InventoryItems] (
    [Id]             UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    [ItemType]       NVARCHAR(50)     NOT NULL, -- 'Vaccine' or 'Medication'
    [Name]           NVARCHAR(200)    NOT NULL,
    [Category]       NVARCHAR(100)    NULL,
    [Sku]            NVARCHAR(100)    NULL,
    [BatchNumber]    NVARCHAR(100)    NULL,
    [Quantity]       INT              NOT NULL DEFAULT 0,
    [Unit]           NVARCHAR(50)     NULL,     -- 'vials', 'doses', 'tablets', 'bottles', etc.
    [MinStockLevel]  INT              NOT NULL DEFAULT 5,
    [UnitPrice]      DECIMAL(18, 2)   NULL,
    [ExpirationDate] DATE             NULL,
    [Manufacturer]   NVARCHAR(200)    NULL,
    [Notes]          NVARCHAR(MAX)    NULL,
    [IsDeleted]      BIT              NOT NULL DEFAULT 0,
    [DeletedAt]      DATETIME2        NULL,
    [CreatedAt]      DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [UpdatedAt]      DATETIME2        NULL,
    CONSTRAINT [CK_InventoryItems_ItemType] CHECK ([ItemType] IN ('Vaccine', 'Medication', 'vaccine', 'medication'))
);
CREATE NONCLUSTERED INDEX [IX_InventoryItems_ItemType_IsDeleted] ON [InventoryItems] ([ItemType], [IsDeleted]);
CREATE NONCLUSTERED INDEX [IX_InventoryItems_Quantity] ON [InventoryItems] ([Quantity]);
GO

-- 4.14 EF Core Migrations History Table
CREATE TABLE [__EFMigrationsHistory] (
    [MigrationId]    NVARCHAR(150) NOT NULL PRIMARY KEY,
    [ProductVersion] NVARCHAR(32)  NOT NULL
);
GO

-- ======================================================================================
-- 5. Fresh Start Seed Data (Clean Production Defaults Only)
-- ======================================================================================

-- 5.1 Clinic Staff Accounts (No mock pet owners, No demo user)
-- Password for Admin@pawrtal.com: Admin01
-- Password for RebeccaGoyena@pawrtal.com: RebeccaGoyena01
-- Password for Solangon@pawrtal.com: Solangon01
INSERT INTO [Users] 
(
    [Id], [Email], [DisplayName], [FirstName], [LastName], [UserType], [Phone], [Address], 
    [LicenseNumber], [Specialization], [PasswordHash], [CreatedAt], [UpdatedAt], [IsDeleted]
)
VALUES 
    (
        N'72ff01f7-40fe-40c2-8e80-97bedf91091b', 
        N'Admin@pawrtal.com', 
        N'Admin', 
        N'Clinic',
        N'Admin',
        N'admin', 
        N'09123456789', 
        N'Clinic HQ', 
        NULL, 
        NULL, 
        N'08AShwlBk5tdtilhqL67lw==', -- Encrypted Admin01
        SYSUTCDATETIME(), 
        SYSUTCDATETIME(), 
        0
    ),
    (
        N'c1a2b3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 
        N'RebeccaGoyena@pawrtal.com', 
        N'Dr. Rebecca Goyena', 
        N'Rebecca',
        N'Goyena',
        N'veterinarian', 
        N'09171234567', 
        N'VM Veterinary Clinic', 
        N'PRC-0078901', 
        N'General Veterinary Medicine & Surgery', 
        N'+i3+Hhn8jdLZSrVlnrkpag==', -- Encrypted RebeccaGoyena01
        SYSUTCDATETIME(), 
        SYSUTCDATETIME(), 
        0
    ),
    (
        N'd759d61c-848e-49b0-98fe-c2a4c11438a2', 
        N'Solangon@pawrtal.com', 
        N'Dr. Solangon', 
        N'Solangon',
        N'Veterinarian',
        N'veterinarian', 
        N'09234567890', 
        N'VM Veterinary Clinic', 
        N'PRC-1234567', 
        N'General Veterinary Medicine & Surgery', 
        N'lQhOeJEAs0BqfgKRd8oNUg==', -- Encrypted Solangon01
        SYSUTCDATETIME(), 
        SYSUTCDATETIME(), 
        0
    );
GO

-- 5.2 Clinical Supplies & Inventory Starter Catalog (Vaccines & Medications)
INSERT INTO [InventoryItems] 
(
    [Id], [ItemType], [Name], [Category], [Sku], [BatchNumber], 
    [Quantity], [Unit], [MinStockLevel], [UnitPrice], [ExpirationDate], 
    [Manufacturer], [Notes], [IsDeleted], [CreatedAt]
)
VALUES
    -- ── Core & Non-Core Vaccines ────────────────────────────────────────────────
    (
        NEWID(), 'Vaccine', 'Rabies Vaccine (Defensor 3)', 'Rabies', 
        'VAC-RAB-001', 'RB-2026-09A', 45, 'vials', 10, 350.00, 
        DATEADD(month, 14, CAST(GETDATE() AS DATE)), 'Zoetis', 
        'Store at 2°C to 8°C. Protect from light. Administer subcutaneously.', 0, SYSUTCDATETIME()
    ),
    (
        NEWID(), 'Vaccine', 'DHPP 5-in-1 Vaccine (Nobivac)', 'Canine Multivalent', 
        'VAC-DHPP-002', 'DH-4491-B', 32, 'doses', 8, 480.00, 
        DATEADD(month, 10, CAST(GETDATE() AS DATE)), 'Boehringer Ingelheim', 
        'Distemper, Hepatitis, Parvovirus, Parainfluenza combination.', 0, SYSUTCDATETIME()
    ),
    (
        NEWID(), 'Vaccine', 'Bordetella Bronchiseptica (Canine Cough)', 'Non-Core Vaccine', 
        'VAC-BOR-003', 'BB-8820-C', 6, 'doses', 8, 420.00, 
        DATEADD(month, 8, CAST(GETDATE() AS DATE)), 'Merck Animal Health', 
        'Oral or intranasal vaccine for canine infectious respiratory disease.', 0, SYSUTCDATETIME()
    ),
    (
        NEWID(), 'Vaccine', 'FVRCP Core Feline 3-in-1 (Felocell 3)', 'Feline Multivalent', 
        'VAC-FVR-004', 'FV-1102-K', 25, 'doses', 6, 450.00, 
        DATEADD(month, 12, CAST(GETDATE() AS DATE)), 'Zoetis', 
        'Feline Viral Rhinotracheitis, Calicivirus, Panleukopenia.', 0, SYSUTCDATETIME()
    ),
    (
        NEWID(), 'Vaccine', 'FeLV Feline Leukemia Vaccine', 'Non-Core Vaccine', 
        'VAC-FELV-005', 'FL-9021-M', 12, 'vials', 5, 520.00, 
        DATEADD(month, 11, CAST(GETDATE() AS DATE)), 'Elanco', 
        'For outdoor or at-risk cats. Pre-test for FeLV antigen recommended.', 0, SYSUTCDATETIME()
    ),

    -- ── Clinical Medications ───────────────────────────────────────────────────
    (
        NEWID(), 'Medication', 'Clavamox 62.5mg', 'Antibiotic', 
        'MED-CLAV-010', 'CL-7721-P', 120, 'tablets', 30, 45.00, 
        DATEADD(month, 18, CAST(GETDATE() AS DATE)), 'Zoetis', 
        'Amoxicillin and clavulanate potassium broad-spectrum antibacterial.', 0, SYSUTCDATETIME()
    ),
    (
        NEWID(), 'Medication', 'Metacam Oral Suspension 1.5mg/mL', 'NSAID / Pain Relief', 
        'MED-META-011', 'MC-3329-D', 3, 'bottles', 5, 850.00, 
        DATEADD(month, 15, CAST(GETDATE() AS DATE)), 'Boehringer Ingelheim', 
        'Non-steroidal anti-inflammatory for osteoarthritis and acute pain in dogs.', 0, SYSUTCDATETIME()
    ),
    (
        NEWID(), 'Medication', 'NexGard Spectra (15-30kg)', 'Antiparasitic', 
        'MED-NEX-012', 'NX-8841-L', 38, 'chewables', 10, 650.00, 
        DATEADD(month, 20, CAST(GETDATE() AS DATE)), 'Boehringer Ingelheim', 
        'Monthly chewable against fleas, ticks, heartworm, and intestinal worms.', 0, SYSUTCDATETIME()
    ),
    (
        NEWID(), 'Medication', 'Prednisone 5mg', 'Corticosteroid', 
        'MED-PRED-013', 'PR-1044-T', 180, 'tablets', 40, 15.00, 
        DATEADD(month, 22, CAST(GETDATE() AS DATE)), 'MedVet Labs', 
        'Glucocorticoid for allergy management and immune-mediated conditions.', 0, SYSUTCDATETIME()
    ),
    (
        NEWID(), 'Medication', 'Cephalexin 250mg', 'Antibiotic', 
        'MED-CEPH-014', 'CP-5520-X', 85, 'capsules', 25, 32.00, 
        DATEADD(month, 16, CAST(GETDATE() AS DATE)), 'Teva Animal Health', 
        'First-generation cephalosporin for pyoderma and soft tissue infections.', 0, SYSUTCDATETIME()
    ),
    (
        NEWID(), 'Medication', 'Gabapentin 100mg', 'Sedative / Anxiety', 
        'MED-GABA-015', 'GB-4490-W', 65, 'capsules', 20, 28.00, 
        DATEADD(month, 17, CAST(GETDATE() AS DATE)), 'Aurobindo', 
        'Adjunctive therapy for chronic pain and pre-visit veterinary anxiety.', 0, SYSUTCDATETIME()
    );
GO

-- ======================================================================================
-- 6. Verification
-- ======================================================================================
PRINT '======================================================================================';
PRINT 'PawrtalDB initialized successfully with clean production schema and zero mock data.';
PRINT 'Active Users: ' + CAST((SELECT COUNT(*) FROM [Users]) AS NVARCHAR(10));
PRINT 'Clinical Supplies: ' + CAST((SELECT COUNT(*) FROM [InventoryItems]) AS NVARCHAR(10));
PRINT 'Pets: ' + CAST((SELECT COUNT(*) FROM [Pets]) AS NVARCHAR(10)) + ' (Clean fresh start)';
PRINT 'Appointments: ' + CAST((SELECT COUNT(*) FROM [Appointments]) AS NVARCHAR(10)) + ' (Clean fresh start)';
PRINT '======================================================================================';
GO
