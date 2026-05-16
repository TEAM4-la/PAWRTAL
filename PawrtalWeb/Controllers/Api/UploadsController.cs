using Microsoft.AspNetCore.Mvc;

namespace Pawtral.Web.Controllers.Api;

[ApiController]
[Route("api/uploads")]
public class UploadsController : ControllerBase
{
    [HttpPost]
    [RequestSizeLimit(20_000_000)] // 20MB
    public async Task<ActionResult<object>> Upload([FromForm] IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "file is required" });

        var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
        Directory.CreateDirectory(uploadsDir);

        var ext = Path.GetExtension(file.FileName);
        var safeExt = string.IsNullOrWhiteSpace(ext) ? "" : ext;
        var name = $"{Guid.NewGuid():N}{safeExt}";
        var absPath = Path.Combine(uploadsDir, name);

        await using (var stream = System.IO.File.Create(absPath))
        {
            await file.CopyToAsync(stream);
        }

        var publicUrl = $"/uploads/{name}";
        return Ok(new { file_url = publicUrl });
    }
}

