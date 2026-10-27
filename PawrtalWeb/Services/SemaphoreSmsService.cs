using System.Text.RegularExpressions;

namespace PawtralWeb.Services;

public class SemaphoreSmsService : ISmsService
{
    private readonly HttpClient _http;
    private readonly IConfiguration _config;
    private readonly ILogger<SemaphoreSmsService> _logger;

    public SemaphoreSmsService(HttpClient http, IConfiguration config, ILogger<SemaphoreSmsService> logger)
    {
        _http = http;
        _config = config;
        _logger = logger;

        var baseUrl = _config["Semaphore:BaseUrl"] ?? "https://api.semaphore.co";
        _http.BaseAddress = new Uri(baseUrl.TrimEnd('/'));
        _http.Timeout = TimeSpan.FromSeconds(10);
    }

    public async Task<bool> SendSmsAsync(string recipient, string message)
    {
        var result = await SendSmsDetailedAsync(recipient, message);
        return result.Success;
    }

    public async Task<(bool Success, string Message)> SendSmsDetailedAsync(string recipient, string message)
    {
        var enabled = _config.GetValue<bool>("Semaphore:Enabled", true);
        if (!enabled)
        {
            _logger.LogInformation("Semaphore SMS is disabled in configuration.");
            return (false, "Semaphore SMS is disabled in configuration.");
        }

        var apiKey = _config["Semaphore:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            _logger.LogWarning("Semaphore ApiKey is not configured.");
            return (false, "Semaphore ApiKey is not configured.");
        }

        var normalizedPhone = NormalizePhilippineNumber(recipient);
        if (string.IsNullOrWhiteSpace(normalizedPhone))
        {
            _logger.LogWarning("Invalid phone number for SMS dispatch: {Phone}", recipient);
            return (false, $"Invalid Philippine mobile number format: '{recipient}'. Expected 09XXXXXXXXX or +639XXXXXXXXX.");
        }

        if (string.IsNullOrWhiteSpace(message))
            return (false, "Message body cannot be empty.");

        var senderName = _config["Semaphore:SenderName"];

        try
        {
            var parameters = new Dictionary<string, string>
            {
                { "apikey", apiKey.Trim() },
                { "number", normalizedPhone },
                { "message", message }
            };

            if (!string.IsNullOrWhiteSpace(senderName))
            {
                parameters.Add("sendername", senderName.Trim());
            }

            using var content = new FormUrlEncodedContent(parameters);
            var response = await _http.PostAsync("/api/v4/messages", content);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("SMS dispatched successfully via Semaphore to {Phone}. Response: {Response}", normalizedPhone, responseBody);
                return (true, $"SMS sent successfully. Provider response: {responseBody}");
            }
            else
            {
                _logger.LogWarning("Semaphore returned HTTP {Status} for recipient {Phone}. Response: {Response}", (int)response.StatusCode, normalizedPhone, responseBody);
                return (false, $"Semaphore error HTTP {(int)response.StatusCode}: {responseBody}");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception while attempting to send SMS via Semaphore to {Phone}", normalizedPhone);
            return (false, $"Exception dispatching SMS via Semaphore: {ex.Message}");
        }
    }

    public static string? NormalizePhilippineNumber(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return null;

        var cleaned = Regex.Replace(raw, @"[^\d+]", "");
        if (cleaned.StartsWith("+639") && cleaned.Length == 13) return "0" + cleaned.Substring(3);
        if (cleaned.StartsWith("639") && cleaned.Length == 12) return "0" + cleaned.Substring(2);
        if (cleaned.StartsWith("09") && cleaned.Length == 11) return cleaned;
        if (cleaned.StartsWith("9") && cleaned.Length == 10) return "0" + cleaned;

        return null;
    }
}
