using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace PawtralWeb.Services;

public class UniSmsService : ISmsService
{
    private readonly HttpClient _http;
    private readonly IConfiguration _config;
    private readonly ILogger<UniSmsService> _logger;

    public UniSmsService(HttpClient http, IConfiguration config, ILogger<UniSmsService> logger)
    {
        _http = http;
        _config = config;
        _logger = logger;

        var baseUrl = _config["UniSms:BaseUrl"] ?? "https://unismsapi.com";
        _http.BaseAddress = new Uri(baseUrl.TrimEnd('/'));
        _http.Timeout = TimeSpan.FromSeconds(8);

        var secretKey = _config["UniSms:SecretKey"] ?? "";
        if (!string.IsNullOrWhiteSpace(secretKey))
        {
            var authHeader = Convert.ToBase64String(Encoding.ASCII.GetBytes($"{secretKey.Trim()}:"));
            _http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", authHeader);
        }
    }

    public async Task<bool> SendSmsAsync(string recipient, string message)
    {
        var result = await SendSmsDetailedAsync(recipient, message);
        return result.Success;
    }

    public async Task<(bool Success, string Message)> SendSmsDetailedAsync(string recipient, string message)
    {
        var enabled = _config.GetValue<bool>("UniSms:Enabled", true);
        if (!enabled)
        {
            _logger.LogInformation("UniSMS is disabled in configuration.");
            return (false, "UniSMS is disabled in configuration.");
        }

        var secretKey = _config["UniSms:SecretKey"];
        if (string.IsNullOrWhiteSpace(secretKey))
        {
            _logger.LogWarning("UniSMS SecretKey is not configured.");
            return (false, "UniSMS SecretKey is not configured.");
        }

        var normalizedPhone = NormalizePhilippineNumber(recipient);
        if (string.IsNullOrWhiteSpace(normalizedPhone))
        {
            _logger.LogWarning("Invalid phone number for SMS dispatch: {Phone}", recipient);
            return (false, $"Invalid Philippine mobile number format: '{recipient}'. Must be 10-11 digits (e.g., 09XXXXXXXXX).");
        }

        if (string.IsNullOrWhiteSpace(message))
            return (false, "Message body cannot be empty.");

        var senderId = _config["UniSms:SenderId"] ?? "Unisoft";

        try
        {
            var payload = new
            {
                recipient = normalizedPhone,
                content = message,
                sender_id = senderId
            };

            var jsonContent = new StringContent(
                JsonSerializer.Serialize(payload),
                Encoding.UTF8,
                "application/json"
            );

            var response = await _http.PostAsync("/api/sms", jsonContent);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("SMS dispatched successfully via UniSMS to {Phone}. Response: {Response}", normalizedPhone, responseBody);
                return (true, $"SMS sent successfully. Provider response: {responseBody}");
            }
            else
            {
                _logger.LogWarning("UniSMS returned HTTP {Status} for recipient {Phone}. Response: {Response}", (int)response.StatusCode, normalizedPhone, responseBody);
                return (false, $"UniSMS error HTTP {(int)response.StatusCode}: {responseBody}");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception while attempting to send SMS via UniSMS to {Phone}", normalizedPhone);
            return (false, $"Exception dispatching SMS: {ex.Message}");
        }
    }

    public static string? NormalizePhilippineNumber(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return null;

        var cleaned = Regex.Replace(raw, @"[^\d+]", "");
        if (cleaned.StartsWith("+639") && cleaned.Length == 13) return cleaned;
        if (cleaned.StartsWith("639") && cleaned.Length == 12) return "+" + cleaned;
        if (cleaned.StartsWith("09") && cleaned.Length == 11) return "+63" + cleaned.Substring(1);
        if (cleaned.StartsWith("9") && cleaned.Length == 10) return "+63" + cleaned;

        return null;
    }
}
