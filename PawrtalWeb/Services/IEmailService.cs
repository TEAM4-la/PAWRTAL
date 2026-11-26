namespace PawtralWeb.Services
{
    public interface IEmailService
    {
        Task<bool> SendEmailAsync(string toEmail, string subject, string htmlBody, string? textBody = null);
        Task<bool> SendAppointmentConfirmationAsync(string toEmail, string ownerName, string petName, string date, string time, string reason, string vetName);
        Task<bool> SendQueueTicketAlertAsync(string toEmail, string ownerName, string petName, string ticketNumber, string statusMessage);
        Task<bool> SendClinicalVisitSummaryAsync(string toEmail, string ownerName, string petName, string date, string vetName, string diagnosis, string treatment, string? weight = null, string? temperature = null);
    }
}
