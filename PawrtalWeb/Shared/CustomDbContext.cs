using Microsoft.EntityFrameworkCore;
namespace PawrtalWeb.Shared;

public partial class PawrtalDbContext : DbContext
{
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
        {
            IConfigurationRoot configuration = new ConfigurationBuilder()
               .SetBasePath(Directory.GetCurrentDirectory())
               .AddJsonFile("appsettings.json")
               .Build();
            var connectionString = configuration.GetConnectionString("PawrtalDB");
            optionsBuilder.UseSqlServer(connectionString);
        }
    }
}
