using Microsoft.EntityFrameworkCore;
using PawrtalWeb.Models;
using PawrtalWeb.Shared;
using System.Globalization;

namespace PawtralWeb.Services;

public class AppointmentExpirationService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<AppointmentExpirationService> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(1); // Run every minute

    public AppointmentExpirationService(IServiceProvider serviceProvider, ILogger<AppointmentExpirationService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Appointment Expiration Service running.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CheckForExpiredAppointments(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred executing Appointment Expiration Check.");
            }

            await Task.Delay(_checkInterval, stoppingToken);
        }
    }

    private async Task CheckForExpiredAppointments(CancellationToken stoppingToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PawrtalDbContext>();
        var notifications = scope.ServiceProvider.GetRequiredService<NotificationService>();

        var today = DateOnly.FromDateTime(DateTime.Now);
        var now = DateTime.Now;

        // Find pending appointments where the date is today or earlier
        var potentiallyExpired = await db.Appointments
            .Where(a => a.Status == "pending" && a.Date <= today && !a.IsDeleted)
            .ToListAsync(stoppingToken);

        if (!potentiallyExpired.Any())
        {
            return;
        }

        var expiredAppointments = new List<Appointment>();

        foreach (var appt in potentiallyExpired)
        {
            bool isExpired = appt.Date < today;
            if (!isExpired && appt.Date == today)
            {
                if (DateTime.TryParseExact($"{appt.Date:yyyy-MM-dd} {appt.TimeSlot}", "yyyy-MM-dd hh:mm tt", CultureInfo.InvariantCulture, DateTimeStyles.None, out var apptDateTime))
                {
                    if (apptDateTime <= now)
                    {
                        isExpired = true;
                    }
                }
                else
                {
                    // Fallback if parsing fails: just expire it if it's past noon? We'll leave it pending till tomorrow.
                }
            }

            if (isExpired)
            {
                expiredAppointments.Add(appt);
            }
        }

        if (!expiredAppointments.Any())
        {
            return;
        }

        var petIds = expiredAppointments.Select(a => a.PetId).Distinct().ToList();
        var pets = await db.Pets.Where(p => petIds.Contains(p.Id)).ToDictionaryAsync(p => p.Id, p => p.Name, stoppingToken);

        foreach (var appt in expiredAppointments)
        {
            appt.Status = "expired";
            appt.UpdatedAt = DateTime.UtcNow;

            string petName = pets.TryGetValue(appt.PetId, out var name) ? name : "Your pet";

            // Notify the pet owner
            if (!string.IsNullOrWhiteSpace(appt.OwnerEmail))
            {
                await notifications.CreateNotificationAsync(
                    appt.OwnerEmail,
                    "appointment",
                    "Appointment Expired",
                    $"Your pending appointment for {petName} on {appt.Date:MMM d, yyyy} at {appt.TimeSlot} has expired.",
                    "appointments"
                );
            }

            // Also optionally notify the vet if assigned
            if (!string.IsNullOrWhiteSpace(appt.VetEmail))
            {
                 await notifications.CreateNotificationAsync(
                    appt.VetEmail,
                    "appointment",
                    "Appointment Expired",
                    $"A pending appointment for {petName} on {appt.Date:MMM d, yyyy} at {appt.TimeSlot} has expired.",
                    "appointments"
                );
            }

            _logger.LogInformation("Marked appointment {AppointmentId} as expired and notified owner.", appt.Id);
        }

        await db.SaveChangesAsync(stoppingToken);
    }
}
