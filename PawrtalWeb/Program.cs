//var builder = WebApplication.CreateBuilder(args);

//// Add services to the container.
//builder.Services.AddControllersWithViews();

//var app = builder.Build();

//// Configure the HTTP request pipeline.
//if (!app.Environment.IsDevelopment())
//{
//    app.UseExceptionHandler("/Home/Error");
//}
//app.UseRouting();

//app.UseAuthorization();

//app.MapStaticAssets();

////app.MapControllerRoute(
////    name: "default",
////    pattern: "{controller=Home}/{action=Index}/{id?}")
////    .WithStaticAssets();

////// Enable default file mapping (looks for index.html, default.html, etc.)
////app.UseDefaultFiles();

////// Enable serving the actual static files from wwwroot
////app.UseStaticFiles();

//app.UseFileServer();

//app.Run();

using Microsoft.EntityFrameworkCore;
using PawrtalWeb.Shared;
using PawtralWeb.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddDbContext<PawrtalDbContext>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("PawrtalDB"));
});

builder.Services.AddScoped<NotificationService>();
builder.Services.AddHostedService<AppointmentExpirationService>();

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
}

app.UseRouting();
app.UseAuthorization();
app.UseStaticFiles(); // serves wwwroot (Vite build output)

// Serve user-uploaded files from the "uploads" folder (outside wwwroot so Vite builds don't delete them)
var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
Directory.CreateDirectory(uploadsPath);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads"
});

app.MapControllers();              // ← API routes matched first
app.MapFallbackToFile("index.html"); // ← React SPA catches everything else

app.Run();
