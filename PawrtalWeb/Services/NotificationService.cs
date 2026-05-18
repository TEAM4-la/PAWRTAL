using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PawrtalWeb.Shared;
using PawrtalWeb.Models;

namespace PawtralWeb.Services
{
    public class NotificationService
    {
        private readonly PawrtalDbContext _db;

        public NotificationService(PawrtalDbContext db)
        {
            _db = db;
        }

        public async Task CreateNotificationAsync(string? email, string type, string title, string message, string? prefKey = null)
        {
            if (string.IsNullOrWhiteSpace(email)) return;

            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null) return;

            if (!string.IsNullOrEmpty(prefKey) && !string.IsNullOrWhiteSpace(user.NotificationPrefsJson))
            {
                try
                {
                    var prefs = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(user.NotificationPrefsJson);
                    if (prefs != null && prefs.TryGetValue(prefKey, out var el))
                    {
                        if (el.ValueKind == JsonValueKind.False) return; // User opted out
                    }
                }
                catch { }
            }

            _db.Notifications.Add(new Notification
            {
                Id = Guid.NewGuid(),
                UserEmail = email,
                Type = type,
                Title = title,
                Message = message,
                CreatedAt = DateTime.UtcNow
            });

            await _db.SaveChangesAsync();
        }
    }
}


