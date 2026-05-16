using Microsoft.AspNetCore.Mvc;

namespace Pawtral.Web.Controllers.Api;

public static class ApiUserContext
{
    public const string UserEmailHeader = "X-User-Email";
    public const string UserRoleHeader = "X-User-Role";

    public static string GetUserEmail(HttpRequest request, string fallback = "demo@example.com")
    {
        if (request.Headers.TryGetValue(UserEmailHeader, out var values))
        {
            var headerEmail = values.ToString();
            if (!string.IsNullOrWhiteSpace(headerEmail))
            {
                return headerEmail.Trim();
            }
        }

        if (request.Query.TryGetValue("email", out var queryEmail))
        {
            var q = queryEmail.ToString();
            if (!string.IsNullOrWhiteSpace(q))
            {
                return q.Trim();
            }
        }

        return fallback;
    }

    public static string? GetUserRole(HttpRequest request)
    {
        if (request.Headers.TryGetValue(UserRoleHeader, out var values))
        {
            var role = values.ToString();
            return string.IsNullOrWhiteSpace(role) ? null : role.Trim();
        }
        return null;
    }

    public static string? MapRoleToUserType(string? role)
    {
        if (string.IsNullOrWhiteSpace(role)) return null;
        var r = role.Trim().ToLowerInvariant();
        return r switch
        {
            "owner" => "pet_owner",
            "pet_owner" => "pet_owner",
            "vet" => "veterinarian",
            "veterinarian" => "veterinarian",
            "admin" => "admin",
            _ => null
        };
    }

    public static ActionResult BadRequestMissing(string fieldName) =>
        new BadRequestObjectResult(new { error = $"{fieldName} is required" });
}

