namespace PawtralWeb.Services;

public interface ISmsService
{
    Task<bool> SendSmsAsync(string recipient, string message);
    Task<(bool Success, string Message)> SendSmsDetailedAsync(string recipient, string message);
}
