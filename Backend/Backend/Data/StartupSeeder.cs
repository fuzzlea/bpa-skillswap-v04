using Microsoft.AspNetCore.Identity;
using bpa_skillswap_v04.Models;
using Microsoft.EntityFrameworkCore;
using System.Linq;

// For seeding application data
using bpa_skillswap_v04.Data;

namespace bpa_skillswap_v04.Data
{
    public static class StartupSeeder
    {
        public static async Task SeedAsync(IServiceProvider services)
        {
            using var scope = services.CreateScope();
            var sp = scope.ServiceProvider;
            var userManager = sp.GetRequiredService<UserManager<ApplicationUser>>();
            var roleManager = sp.GetRequiredService<RoleManager<IdentityRole>>();
            var env = sp.GetRequiredService<IHostEnvironment>();
            var config = sp.GetRequiredService<IConfiguration>();

            // Ensure Admin role
            var adminRole = "Admin";
            if (!await roleManager.RoleExistsAsync(adminRole))
            {
                await roleManager.CreateAsync(new IdentityRole(adminRole));
            }

            // Admin credentials: prefer config -> env; only allow defaults in Development
            var adminEmail = config["Admin:Email"] ?? Environment.GetEnvironmentVariable("ADMIN_EMAIL") ?? "admin@local";
            var adminPassword = config["Admin:Password"] ?? Environment.GetEnvironmentVariable("ADMIN_PASSWORD");

            if (string.IsNullOrWhiteSpace(adminPassword))
            {
                if (env.IsDevelopment())
                {
                    adminPassword = "Admin123!"; // dev default
                }
                else
                {
                    // In production, do not auto-create an admin without a configured password
                    var logger = sp.GetRequiredService<ILogger<Program>>();
                    logger.LogWarning("Admin user not created: ADMIN_PASSWORD not set in production.");
                    return;
                }
            }

            // Ensure admin user
            var adminUser = await userManager.FindByEmailAsync(adminEmail);
            if (adminUser == null)
            {
                adminUser = new ApplicationUser { UserName = "admin", Email = adminEmail, DisplayName = "Administrator" };
                var result = await userManager.CreateAsync(adminUser, adminPassword);
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(adminUser, adminRole);
                }
                else
                {
                    var logger = sp.GetRequiredService<ILogger<Program>>();
                    logger.LogWarning("Failed to create admin user: {Errors}", string.Join(';', result.Errors.Select(e => e.Description)));
                }
            }
            else
            {
                // Admin user exists, ensure they have the Admin role
                var isAdmin = await userManager.IsInRoleAsync(adminUser, adminRole);
                if (!isAdmin)
                {
                    var result = await userManager.AddToRoleAsync(adminUser, adminRole);
                    if (!result.Succeeded)
                    {
                        var logger = sp.GetRequiredService<ILogger<Program>>();
                        logger.LogWarning("Failed to add Admin role to existing user: {Errors}", string.Join(';', result.Errors.Select(e => e.Description)));
                    }
                }
            }

            // ---------- Application data seeding (skills, demo users, profiles, sessions) ----------
            var db = sp.GetRequiredService<ApplicationDbContext>();

            // Seed some common skills
            var skillNames = new[] { "Math Tutoring", "Guitar", "Programming", "Photography", "Writing" };
            foreach (var name in skillNames)
            {
                if (!await db.Skills.AnyAsync(s => s.Name == name))
                {
                    db.Skills.Add(new Skill { Name = name });
                }
            }

            await db.SaveChangesAsync();

            // Create demo users if they don't exist (dev only)
            if (env.IsDevelopment())
            {
                async Task<ApplicationUser> EnsureUser(string userName, string email, string displayName)
                {
                    var u = await userManager.FindByEmailAsync(email);
                    if (u != null) return u;
                    var pw = config[$"DemoUsers:{userName}:Password"] ?? Environment.GetEnvironmentVariable($"DEMO_{userName.ToUpper()}_PASSWORD") ?? "Demo123!";
                    u = new ApplicationUser { UserName = userName, Email = email, DisplayName = displayName };
                    var res = await userManager.CreateAsync(u, pw);
                    if (!res.Succeeded)
                    {
                        var logger = sp.GetRequiredService<ILogger<Program>>();
                        logger.LogWarning("Failed to create demo user {User}: {Errors}", userName, string.Join(';', res.Errors.Select(e => e.Description)));
                    }
                    return u;
                }

                var alice = await EnsureUser("alice", "alice@local", "Alice Learner");
                var bob = await EnsureUser("bob", "bob@local", "Bob Tutor");

                await db.SaveChangesAsync();

                // Ensure profiles exist for demo users
                if (!await db.Profiles.AnyAsync(p => p.UserId == alice.Id))
                {
                    var p = new Profile { UserId = alice.Id, DisplayName = "Alice Learner", Bio = "College student learning programming and photography.", Location = "Campus" };
                    // Alice wants Programming and Photography
                    var prog = await db.Skills.FirstOrDefaultAsync(s => s.Name == "Programming");
                    var photo = await db.Skills.FirstOrDefaultAsync(s => s.Name == "Photography");
                    if (prog != null) p.SkillsWanted.Add(prog);
                    if (photo != null) p.SkillsWanted.Add(photo);
                    db.Profiles.Add(p);
                }

                if (!await db.Profiles.AnyAsync(p => p.UserId == bob.Id))
                {
                    var p = new Profile { UserId = bob.Id, DisplayName = "Bob Tutor", Bio = "Experienced guitarist and programmer.", Location = "Campus" };
                    var guitar = await db.Skills.FirstOrDefaultAsync(s => s.Name == "Guitar");
                    var prog = await db.Skills.FirstOrDefaultAsync(s => s.Name == "Programming");
                    if (guitar != null) p.SkillsOffered.Add(guitar);
                    if (prog != null) p.SkillsOffered.Add(prog);
                    db.Profiles.Add(p);
                }

                await db.SaveChangesAsync();

                // Create a sample session hosted by Bob (if none exist)
                var bobProfile = await db.Profiles.Include(p => p.User).FirstOrDefaultAsync(p => p.UserId == bob.Id);
                var existingSession = await db.Sessions.FirstOrDefaultAsync(s => s.Title == "Intro to C#");
                if (bobProfile != null && existingSession == null)
                {
                    var progSkill = await db.Skills.FirstOrDefaultAsync(s => s.Name == "Programming");
                    var session = new Session
                    {
                        Title = "Intro to C#",
                        Description = "Beginner-friendly overview of C# basics.",
                        SkillId = progSkill?.Id,
                        HostProfileId = bobProfile.Id,
                        ScheduledAt = DateTime.UtcNow.AddDays(1),
                        DurationMinutes = 60,
                        IsOpen = true
                    };
                    db.Sessions.Add(session);
                    await db.SaveChangesAsync();

                    // Create a request from Alice to join that session
                    var aliceProfile = await db.Profiles.FirstOrDefaultAsync(p => p.UserId == alice.Id);
                    if (aliceProfile != null)
                    {
                        var request = new SessionRequest
                        {
                            SessionId = session.Id,
                            RequesterProfileId = aliceProfile.Id,
                            Message = "I'd love to join and learn the basics!",
                            Status = "Pending",
                            CreatedAt = DateTime.UtcNow
                        };
                        db.SessionRequests.Add(request);
                        await db.SaveChangesAsync();
                    }
                }
            }
        }
    }
}
