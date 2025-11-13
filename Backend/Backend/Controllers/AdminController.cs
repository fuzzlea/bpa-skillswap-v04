using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using bpa_skillswap_v04.Models;
using bpa_skillswap_v04.Controllers.DTOs;

namespace bpa_skillswap_v04.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;

        public AdminController(UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager)
        {
            _userManager = userManager;
            _roleManager = roleManager;
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = _userManager.Users.Select(u => new
            {
                u.Id,
                u.UserName,
                u.Email,
                u.DisplayName,
                u.EmailConfirmed
            }).ToList();

            var usersWithRoles = new List<object>();
            foreach (var user in users)
            {
                var appUser = await _userManager.FindByIdAsync(user.Id);
                var roles = await _userManager.GetRolesAsync(appUser!);
                usersWithRoles.Add(new
                {
                    user.Id,
                    user.UserName,
                    user.Email,
                    user.DisplayName,
                    user.EmailConfirmed,
                    Roles = roles
                });
            }

            return Ok(usersWithRoles);
        }

        [HttpPost("users")]
        public async Task<IActionResult> AddUser([FromBody] RegisterRequest req)
        {
            var user = new ApplicationUser { UserName = req.UserName, Email = req.Email, DisplayName = req.DisplayName };
            var result = await _userManager.CreateAsync(user, req.Password);
            if (!result.Succeeded)
            {
                return BadRequest(result.Errors.Select(e => e.Description));
            }
            return CreatedAtAction(nameof(GetAllUsers), new { id = user.Id }, new { user.Id, user.UserName, user.Email });
        }

        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound();

            var result = await _userManager.DeleteAsync(user);
            if (!result.Succeeded) return BadRequest(result.Errors.Select(e => e.Description));

            return NoContent();
        }

        [HttpPatch("users/{id}/role")]
        public async Task<IActionResult> ToggleAdminRole(string id, [FromBody] ToggleRoleRequest req)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound();

            var isAdmin = await _userManager.IsInRoleAsync(user, "Admin");
            if (req.IsAdmin && !isAdmin)
            {
                await _userManager.AddToRoleAsync(user, "Admin");
            }
            else if (!req.IsAdmin && isAdmin)
            {
                await _userManager.RemoveFromRoleAsync(user, "Admin");
            }

            return Ok(new { user.Id, user.UserName, IsAdmin = req.IsAdmin });
        }
    }
}
