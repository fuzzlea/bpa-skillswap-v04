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
        // Application entities
        public DbSet<Models.Profile> Profiles { get; set; }
        public DbSet<Models.Skill> Skills { get; set; }
        public DbSet<Models.Session> Sessions { get; set; }
        public DbSet<Models.SessionRequest> SessionRequests { get; set; }
        public DbSet<Models.Rating> Ratings { get; set; }
        public DbSet<Models.Notification> Notifications { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Configure Profile <-> Skill many-to-many for skills offered
            builder.Entity<Models.Profile>()
                .HasMany(p => p.SkillsOffered)
                .WithMany(s => s.OfferedBy)
                .UsingEntity<Dictionary<string, object>>(
                    "ProfileSkillOffered",
                    j => j.HasOne<Models.Skill>().WithMany().HasForeignKey("SkillId").HasConstraintName("FK_ProfileSkillOffered_Skill").OnDelete(DeleteBehavior.Cascade),
                    j => j.HasOne<Models.Profile>().WithMany().HasForeignKey("ProfileId").HasConstraintName("FK_ProfileSkillOffered_Profile").OnDelete(DeleteBehavior.Cascade)
                );

            // Configure Profile <-> Skill many-to-many for skills wanted/sought
            builder.Entity<Models.Profile>()
                .HasMany(p => p.SkillsWanted)
                .WithMany(s => s.WantedBy)
                .UsingEntity<Dictionary<string, object>>(
                    "ProfileSkillWanted",
                    j => j.HasOne<Models.Skill>().WithMany().HasForeignKey("SkillId").HasConstraintName("FK_ProfileSkillWanted_Skill").OnDelete(DeleteBehavior.Cascade),
                    j => j.HasOne<Models.Profile>().WithMany().HasForeignKey("ProfileId").HasConstraintName("FK_ProfileSkillWanted_Profile").OnDelete(DeleteBehavior.Cascade)
                );
        }
    }
}
