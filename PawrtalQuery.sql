USE PawrtalDB;
GO
--USERS(PAGE)
    -- Table: Users (pet owners, vets, admins)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE Users (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        Email NVARCHAR(255) NOT NULL UNIQUE,
        FullName NVARCHAR(255) NOT NULL,
        UserType NVARCHAR(50) NOT NULL, -- 'owner', 'veterinarian', 'admin'
        Phone NVARCHAR(50) NULL,
        Address NVARCHAR(500) NULL,
        AvatarUrl NVARCHAR(500) NULL,
        NotificationPreferences NVARCHAR(MAX) NULL,
        CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 DEFAULT GETUTCDATE(),
        IsDeleted BIT DEFAULT 0
    );
    CREATE INDEX IX_Users_Email ON Users(Email);
END
GO
--USERS(PAGE)--



-- ADD NEW PET(PAGE)
    -- Table: Pets
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Pets')
BEGIN
    CREATE TABLE Pets (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        OwnerEmail NVARCHAR(255) NOT NULL,
        Name NVARCHAR(100) NOT NULL,
        Species NVARCHAR(50) NOT NULL,
        Breed NVARCHAR(100) NULL,
        DateOfBirth DATE NULL,
        Gender NVARCHAR(20) NULL,
        Weight DECIMAL(10, 2) NULL,
        Color NVARCHAR(100) NULL,
        MicrochipId NVARCHAR(100) NULL,
        PhotoUrl NVARCHAR(500) NULL,
        IsNeutered BIT DEFAULT 0,
        CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 DEFAULT GETUTCDATE(),
        IsDeleted BIT DEFAULT 0
    );
    CREATE INDEX IX_Pets_OwnerEmail ON Pets(OwnerEmail);
END
GO

-- Table: PetAllergies
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PetAllergies')
BEGIN
    CREATE TABLE PetAllergies (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        PetId UNIQUEIDENTIFIER NOT NULL,
        AllergyName NVARCHAR(200) NOT NULL,
        IsDeleted BIT DEFAULT 0,
        CONSTRAINT FK_PetAllergies_Pet FOREIGN KEY (PetId) REFERENCES Pets(Id)
    );
    CREATE INDEX IX_PetAllergies_PetId ON PetAllergies(PetId);
END
GO

-- Table: PetMedicalConditions
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PetMedicalConditions')
BEGIN
    CREATE TABLE PetMedicalConditions (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        PetId UNIQUEIDENTIFIER NOT NULL,
        ConditionName NVARCHAR(200) NOT NULL,
        IsDeleted BIT DEFAULT 0,
        CONSTRAINT FK_PetMedicalConditions_Pet FOREIGN KEY (PetId) REFERENCES Pets(Id)
    );
    CREATE INDEX IX_PetMedicalConditions_PetId ON PetMedicalConditions(PetId);
END
GO
--ADD NEW PET(PAGE)--



--BOOK APPOINTMENT(PAGE)
    -- Table: Appointments
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Appointments')
BEGIN
    CREATE TABLE Appointments (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        PetId UNIQUEIDENTIFIER NOT NULL,
        OwnerEmail NVARCHAR(255) NOT NULL,
        Type NVARCHAR(50) NOT NULL,
        Date DATE NOT NULL,
        Time NVARCHAR(20) NOT NULL,
        Status NVARCHAR(50) NOT NULL DEFAULT 'pending',
        Reason NVARCHAR(500) NULL,
        CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 DEFAULT GETUTCDATE(),
        IsDeleted BIT DEFAULT 0,
        CONSTRAINT FK_Appointments_Pet FOREIGN KEY (PetId) REFERENCES Pets(Id)
    );
    CREATE INDEX IX_Appointments_PetId ON Appointments(PetId);
    CREATE INDEX IX_Appointments_Date ON Appointments(Date);
END
GO
--BOOK APPOINTMENT(PAGE)--


--ADD MEDICAL RECORD(PAGE)--
    -- Table: Vaccinations
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Vaccinations')
BEGIN
    CREATE TABLE Vaccinations (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        PetId UNIQUEIDENTIFIER NOT NULL,
        VaccineName NVARCHAR(200) NOT NULL,
        DateAdministered DATE NOT NULL,
        NextDueDate DATE NULL,
        BatchNumber NVARCHAR(100) NULL,
        Notes NVARCHAR(MAX) NULL,
        AdministeredBy NVARCHAR(255) NULL,
        CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
        IsDeleted BIT DEFAULT 0,
        CONSTRAINT FK_Vaccinations_Pet FOREIGN KEY (PetId) REFERENCES Pets(Id)
    );
    CREATE INDEX IX_Vaccinations_PetId ON Vaccinations(PetId);
END
GO

    -- Table: Medications
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Medications')
BEGIN
    CREATE TABLE Medications (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        PetId UNIQUEIDENTIFIER NOT NULL,
        Name NVARCHAR(200) NOT NULL,
        Dosage NVARCHAR(100) NULL,
        Frequency NVARCHAR(100) NULL,
        StartDate DATE NOT NULL,
        EndDate DATE NULL,
        Notes NVARCHAR(MAX) NULL,
        IsActive BIT DEFAULT 1,
        PrescribedBy NVARCHAR(255) NULL,
        CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 DEFAULT GETUTCDATE(),
        IsDeleted BIT DEFAULT 0,
        CONSTRAINT FK_Medications_Pet FOREIGN KEY (PetId) REFERENCES Pets(Id)
    );
    CREATE INDEX IX_Medications_PetId ON Medications(PetId);
END
GO

    -- Table: HealthRecords
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'HealthRecords')
BEGIN
    CREATE TABLE HealthRecords (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        PetId UNIQUEIDENTIFIER NOT NULL,
        VetEmail NVARCHAR(255) NULL,
        VetName NVARCHAR(255) NULL,
        RecordType NVARCHAR(50) NOT NULL,
        Title NVARCHAR(255) NOT NULL,
        Description NVARCHAR(MAX) NULL,
        Date DATE NOT NULL,
        FileUrl NVARCHAR(500) NULL,
        IsVisibleToOwner BIT DEFAULT 1,
        CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
        IsDeleted BIT DEFAULT 0,
        CONSTRAINT FK_HealthRecords_Pet FOREIGN KEY (PetId) REFERENCES Pets(Id)
    );
    CREATE INDEX IX_HealthRecords_PetId ON HealthRecords(PetId);
END
GO
--ADD MEDICAL RECORD(PAGE)--




--GROOMING RECORDS(PAGE)
    -- Table: GroomingRecords
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'GroomingRecords')
BEGIN
    CREATE TABLE GroomingRecords (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        PetId UNIQUEIDENTIFIER NOT NULL,
        Date DATE NOT NULL,
        GroomerName NVARCHAR(200) NULL,
        GroomingType NVARCHAR(100) NOT NULL,
        CoatConditionBefore NVARCHAR(100) NULL,
        CoatStyleNotes NVARCHAR(500) NULL,
        Observations NVARCHAR(MAX) NULL,
        IsVisibleToOwner BIT DEFAULT 1,
        CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
        IsDeleted BIT NOT NULL DEFAULT 0,
        DeletedAt DATETIME2 NULL,
        CONSTRAINT FK_GroomingRecords_Pet FOREIGN KEY (PetId) REFERENCES Pets(Id)
    );
    CREATE INDEX IX_GroomingRecords_PetId ON GroomingRecords(PetId);
    CREATE INDEX IX_GroomingRecords_Date ON GroomingRecords(Date);
    CREATE INDEX IX_GroomingRecords_IsDeleted ON GroomingRecords(IsDeleted);
END
GO
--GROOMING RECORDS(PAGE)--




--ADD JOURNAL ENTRY(PAGE)
    -- Table: JournalEntries
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'JournalEntries')
BEGIN
    CREATE TABLE JournalEntries (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        PetId UNIQUEIDENTIFIER NOT NULL,
        EntryType NVARCHAR(50) NOT NULL,
        Title NVARCHAR(255) NULL,
        Content NVARCHAR(MAX) NULL,
        Date DATE NOT NULL,
        Mood NVARCHAR(50) NULL,
        Weight DECIMAL(10, 2) NULL,
        CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
        IsDeleted BIT DEFAULT 0,
        CONSTRAINT FK_JournalEntries_Pet FOREIGN KEY (PetId) REFERENCES Pets(Id)
    );
    CREATE INDEX IX_JournalEntries_PetId ON JournalEntries(PetId);
END
GO
--ADD JOURNAL ENTRY(PAGE)--




--MESSAGES(PAGE)
    -- Table: Messages
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Messages')
BEGIN
    CREATE TABLE Messages (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        SenderEmail NVARCHAR(255) NOT NULL,
        ReceiverEmail NVARCHAR(255) NOT NULL,
        Content NVARCHAR(MAX) NOT NULL,
        IsRead BIT NOT NULL DEFAULT 0,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        IsDeleted BIT NOT NULL DEFAULT 0,
        DeletedAt DATETIME2 NULL
    );
    
    -- Adding indexes to optimize querying by sender and receiver
    CREATE INDEX IX_Messages_SenderEmail ON Messages(SenderEmail);
    CREATE INDEX IX_Messages_ReceiverEmail ON Messages(ReceiverEmail);
    CREATE INDEX IX_Messages_IsDeleted ON Messages(IsDeleted);
END
GO
--MESSAGES(PAGE)--





-- Table: Notifications
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Notifications')
BEGIN
    CREATE TABLE Notifications (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        UserEmail NVARCHAR(255) NOT NULL,
        Type NVARCHAR(50) NOT NULL,
        Content NVARCHAR(MAX) NOT NULL,
        IsRead BIT DEFAULT 0,
        CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
        IsDeleted BIT DEFAULT 0
    );
    CREATE INDEX IX_Notifications_UserEmail ON Notifications(UserEmail);
END