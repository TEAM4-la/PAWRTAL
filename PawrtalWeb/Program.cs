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

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
}

app.UseRouting();
app.UseAuthorization();
app.UseStaticFiles();

app.MapControllers();              // ← API routes matched first
app.MapFallbackToFile("index.html"); // ← React SPA catches everything else

app.Run();
