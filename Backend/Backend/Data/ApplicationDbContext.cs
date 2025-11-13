using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using bpa_skillswap_v04.Models;

namespace bpa_skillswap_v04.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        // Add your application DbSets here, e.g.
        // public DbSet<Item> Items { get; set; }
    }
}
