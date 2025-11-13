using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Configuration
var configuration = builder.Configuration;

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure DbContext (SQLite for simplicity). Change provider as needed.
builder.Services.AddDbContext<bpa_skillswap_v04.Data.ApplicationDbContext>(options =>
    options.UseSqlite(configuration.GetConnectionString("DefaultConnection")));

// Add Identity with stronger defaults
builder.Services.AddIdentity<bpa_skillswap_v04.Models.ApplicationUser, Microsoft.AspNetCore.Identity.IdentityRole>(options =>
{
    // Stronger password rules for production-safe defaults
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 8;
    options.Password.RequireNonAlphanumeric = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireLowercase = true;
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    options.User.RequireUniqueEmail = true;
})
    .AddEntityFrameworkStores<bpa_skillswap_v04.Data.ApplicationDbContext>()
    .AddDefaultTokenProviders();

// Configure JWT authentication
var jwtSection = configuration.GetSection("Jwt");
// Prefer environment variable for secrets in production
var jwtKey = Environment.GetEnvironmentVariable("JWT_KEY") ?? jwtSection.GetValue<string?>("Key");
var issuer = jwtSection.GetValue<string?>("Issuer");
var audience = jwtSection.GetValue<string?>("Audience");

if (builder.Environment.IsProduction() && string.IsNullOrWhiteSpace(jwtKey))
{
    throw new InvalidOperationException("JWT_KEY environment variable must be set in Production for signing tokens.");
}

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = issuer,
            ValidAudience = audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey!))
        };
    });

// CORS (allow React dev server)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy => policy
            .WithOrigins("http://localhost:5173") // or whatever port React uses
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
});

var app = builder.Build();

// Apply migrations and seed admin user
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var db = services.GetRequiredService<bpa_skillswap_v04.Data.ApplicationDbContext>();
        db.Database.Migrate();
        await bpa_skillswap_v04.Data.StartupSeeder.SeedAsync(services);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while migrating or seeding the database.");
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Enforce HTTPS and HSTS in production
if (app.Environment.IsProduction())
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

app.UseCors("AllowReactApp");

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Minimal protected endpoint for quick verification
app.MapGet("/me", async (Microsoft.AspNetCore.Identity.UserManager<bpa_skillswap_v04.Models.ApplicationUser> userManager, System.Security.Claims.ClaimsPrincipal user) =>
{
    if (!user.Identity?.IsAuthenticated ?? true)
        return Results.Unauthorized();

    var appUser = await userManager.GetUserAsync(user);
    if (appUser == null)
        return Results.NotFound();

    return Results.Ok(new { appUser.UserName, appUser.Email, appUser.DisplayName });
}).RequireAuthorization();

app.Run();
