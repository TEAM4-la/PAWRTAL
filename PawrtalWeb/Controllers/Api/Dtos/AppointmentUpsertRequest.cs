using System.Text.Json.Serialization;

namespace Pawtral.Web.Controllers.Api.Dtos;

public class AppointmentUpsertRequest
{
    [JsonPropertyName("pet_id")]
    public string? PetId { get; set; }

    [JsonPropertyName("owner_email")]
    public string? OwnerEmail { get; set; }

    [JsonPropertyName("vet_email")]
    public string? VetEmail { get; set; }

    [JsonPropertyName("type")]
    public string? Type { get; set; }

    [JsonPropertyName("date")]
    public string? Date { get; set; } // yyyy-MM-dd

    [JsonPropertyName("time")]
    public string? Time { get; set; }

    [JsonPropertyName("reason")]
    public string? Reason { get; set; }

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("is_walk_in")]
    public bool? IsWalkIn { get; set; }

    [JsonPropertyName("queue_number")]
    public string? QueueNumber { get; set; }

    [JsonPropertyName("queue_status")]
    public string? QueueStatus { get; set; }

    [JsonPropertyName("check_in_time")]
    public DateTime? CheckInTime { get; set; }

    [JsonPropertyName("guest_owner_name")]
    public string? GuestOwnerName { get; set; }

    [JsonPropertyName("guest_owner_phone")]
    public string? GuestOwnerPhone { get; set; }
}

