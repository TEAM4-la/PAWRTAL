namespace Pawtral.Web.Controllers.Api.Dtos;

public class TestEmailRequest
{
    public string Email { get; set; } = string.Empty;
    public string? Subject { get; set; }
    public string? Message { get; set; }
}
