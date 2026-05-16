using System.Text.Json.Serialization;

namespace Pawtral.Web.Controllers.Api.Dtos;

public class VaccinationCreateRequest
{
    [JsonPropertyName("pet_id")]
    public string? PetId { get; set; }

    [JsonPropertyName("vaccine_name")]
    public string? VaccineName { get; set; }

    [JsonPropertyName("date_administered")]
    public string? DateAdministered { get; set; }

    [JsonPropertyName("next_due_date")]
    public string? NextDueDate { get; set; }

    [JsonPropertyName("batch_number")]
    public string? BatchNumber { get; set; }

    [JsonPropertyName("notes")]
    public string? Notes { get; set; }

    [JsonPropertyName("administered_by")]
    public string? AdministeredBy { get; set; }
}

