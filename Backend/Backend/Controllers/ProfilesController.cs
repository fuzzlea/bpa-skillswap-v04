using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using bpa_skillswap_v04.Data;
using bpa_skillswap_v04.Models;

namespace bpa_skillswap_v04.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProfilesController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly UserManager<ApplicationUser> _userManager;

        public ProfilesController(ApplicationDbContext db, UserManager<ApplicationUser> userManager)
        {
            _db = db;
            _userManager = userManager;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var profiles = await _db.Profiles
                .Include(p => p.SkillsOffered)
                .Include(p => p.SkillsWanted)
                .Include(p => p.User)
                .Select(p => new
                {
                    p.Id,
                    p.UserId,
                    UserName = p.User != null ? p.User.UserName : null,
                    p.DisplayName,
                    p.Bio,
                    p.Location,
                    SkillsOffered = p.SkillsOffered.Select(s => new { s.Id, s.Name }),
                    SkillsWanted = p.SkillsWanted.Select(s => new { s.Id, s.Name }),
                    p.Availability,
                    p.Contact
                })
                .ToListAsync();

            return Ok(profiles);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var p = await _db.Profiles
                .Include(x => x.SkillsOffered)
                .Include(x => x.SkillsWanted)
                .Include(x => x.User)
                .Where(x => x.Id == id)
                .Select(x => new
                {
                    x.Id,
                    x.UserId,
                    UserName = x.User != null ? x.User.UserName : null,
                    x.DisplayName,
                    x.Bio,
                    x.Location,
                    SkillsOffered = x.SkillsOffered.Select(s => new { s.Id, s.Name }),
                    SkillsWanted = x.SkillsWanted.Select(s => new { s.Id, s.Name }),
                    x.Availability,
                    x.Contact
                })
                .FirstOrDefaultAsync();

            if (p == null) return NotFound();
            return Ok(p);
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> GetMyProfile()
        {
            var userId = _userManager.GetUserId(User);
            var p = await _db.Profiles
                .Include(x => x.SkillsOffered)
                .Include(x => x.SkillsWanted)
                .Include(x => x.User)
                .Where(x => x.UserId == userId)
                .Select(x => new
                {
                    x.Id,
                    x.UserId,
                    UserName = x.User != null ? x.User.UserName : null,
                    x.DisplayName,
                    x.Bio,
                    x.Location,
                    SkillsOffered = x.SkillsOffered.Select(s => new { s.Id, s.Name }),
                    SkillsWanted = x.SkillsWanted.Select(s => new { s.Id, s.Name }),
                    x.Availability,
                    x.Contact
                })
                .FirstOrDefaultAsync();

            if (p == null) return NotFound();
            return Ok(p);
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> CreateOrUpdate([FromBody] ProfileDto dto)
        {
            if (!ModelState.IsValid) return ValidationProblem(ModelState);
            var userId = _userManager.GetUserId(User);
            var profile = await _db.Profiles
                .Include(p => p.SkillsOffered)
                .Include(p => p.SkillsWanted)
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (profile == null)
            {
                profile = new Profile { UserId = userId, DisplayName = dto.DisplayName, Bio = dto.Bio, Location = dto.Location, Contact = dto.Contact, Availability = dto.Availability };
                _db.Profiles.Add(profile);
            }
            else
            {
                profile.DisplayName = dto.DisplayName;
                profile.Bio = dto.Bio;
                profile.Location = dto.Location;
                profile.Contact = dto.Contact;
                profile.Availability = dto.Availability;
            }

            // Update skills: clear and add provided ones
            profile.SkillsOffered.Clear();
            if (dto.SkillsOfferedIds != null && dto.SkillsOfferedIds.Any())
            {
                var offered = await _db.Skills.Where(s => dto.SkillsOfferedIds.Contains(s.Id)).ToListAsync();
                foreach (var s in offered) profile.SkillsOffered.Add(s);
            }

            profile.SkillsWanted.Clear();
            if (dto.SkillsWantedIds != null && dto.SkillsWantedIds.Any())
            {
                var wanted = await _db.Skills.Where(s => dto.SkillsWantedIds.Contains(s.Id)).ToListAsync();
                foreach (var s in wanted) profile.SkillsWanted.Add(s);
            }

            await _db.SaveChangesAsync();
            return Ok(profile);
        }

        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] ProfileDto dto)
        {
            if (!ModelState.IsValid) return ValidationProblem(ModelState);
            var profile = await _db.Profiles.Include(p => p.User).Include(p => p.SkillsOffered).Include(p => p.SkillsWanted).FirstOrDefaultAsync(p => p.Id == id);
            if (profile == null) return NotFound();

            var userId = _userManager.GetUserId(User);
            var isAdmin = await _userManager.IsInRoleAsync(await _userManager.FindByIdAsync(userId), "Admin");
            if (profile.UserId != userId && !isAdmin) return Forbid();

            profile.DisplayName = dto.DisplayName;
            profile.Bio = dto.Bio;
            profile.Location = dto.Location;
            profile.Contact = dto.Contact;
            profile.Availability = dto.Availability;

            profile.SkillsOffered.Clear();
            if (dto.SkillsOfferedIds != null)
            {
                var offered = await _db.Skills.Where(s => dto.SkillsOfferedIds.Contains(s.Id)).ToListAsync();
                foreach (var s in offered) profile.SkillsOffered.Add(s);
            }

            profile.SkillsWanted.Clear();
            if (dto.SkillsWantedIds != null)
            {
                var wanted = await _db.Skills.Where(s => dto.SkillsWantedIds.Contains(s.Id)).ToListAsync();
                foreach (var s in wanted) profile.SkillsWanted.Add(s);
            }

            await _db.SaveChangesAsync();
            return Ok(profile);
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var profile = await _db.Profiles.FirstOrDefaultAsync(p => p.Id == id);
            if (profile == null) return NotFound();
            var userId = _userManager.GetUserId(User);
            var isAdmin = await _userManager.IsInRoleAsync(await _userManager.FindByIdAsync(userId), "Admin");
            if (profile.UserId != userId && !isAdmin) return Forbid();

            _db.Profiles.Remove(profile);
            await _db.SaveChangesAsync();
            return NoContent();
        }

        public class ProfileDto
        {
            public string? DisplayName { get; set; }
            public string? Bio { get; set; }
            public string? Location { get; set; }
            public string? Contact { get; set; }
            public string? Availability { get; set; }
            public int[]? SkillsOfferedIds { get; set; }
            public int[]? SkillsWantedIds { get; set; }
        }
    }
}
