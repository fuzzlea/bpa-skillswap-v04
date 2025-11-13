using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using bpa_skillswap_v04.Models;
using bpa_skillswap_v04.Controllers.DTOs;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using System.Security.Claims;

namespace bpa_skillswap_v04.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IConfiguration _config;

        public AuthController(UserManager<ApplicationUser> userManager, IConfiguration config)
        {
            _userManager = userManager;
            _config = config;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest req)
        {
            var user = new ApplicationUser { UserName = req.UserName, Email = req.Email, DisplayName = req.DisplayName };
            var result = await _userManager.CreateAsync(user, req.Password);
            if (!result.Succeeded)
            {
                return BadRequest(result.Errors.Select(e => e.Description));
            }
            return Ok(new { user.UserName, user.Email });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            var user = await _userManager.FindByNameAsync(req.UserName);
            if (user == null) return Unauthorized();

            var valid = await _userManager.CheckPasswordAsync(user, req.Password);
            if (!valid) return Unauthorized();

            var token = await GenerateJwtToken(user);
            var roles = await _userManager.GetRolesAsync(user);
            return Ok(new { token, roles, userName = user.UserName });
        }

        private async Task<string> GenerateJwtToken(ApplicationUser user)
        {
            var jwtSection = _config.GetSection("Jwt");
            var keyString = jwtSection.GetValue<string?>("Key")!;
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyString));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var expires = DateTime.UtcNow.AddMinutes(jwtSection.GetValue<int>("ExpireMinutes"));

            // Get user roles
            var roles = await _userManager.GetRolesAsync(user);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id),
                new Claim(JwtRegisteredClaimNames.UniqueName, user.UserName ?? ""),
                new Claim(ClaimTypes.NameIdentifier, user.Id)
            };

            // Add role claims
            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var token = new JwtSecurityToken(
                issuer: jwtSection.GetValue<string>("Issuer"),
                audience: jwtSection.GetValue<string>("Audience"),
                claims: claims,
                expires: expires,
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
