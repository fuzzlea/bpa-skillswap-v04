using Microsoft.AspNetCore.Identity;
using bpa_skillswap_v04.Models;

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
        }
    }
}
