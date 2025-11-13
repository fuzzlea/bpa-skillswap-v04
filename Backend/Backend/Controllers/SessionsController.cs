using System;
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
    public class SessionsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly UserManager<ApplicationUser> _userManager;

        public SessionsController(ApplicationDbContext db, UserManager<ApplicationUser> userManager)
        {
            _db = db;
            _userManager = userManager;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var sessions = await _db.Sessions
                .Include(s => s.Skill)
                .Include(s => s.HostProfile)
                .Select(s => new
                {
                    s.Id,
                    s.Title,
                    s.Description,
                    Skill = s.Skill != null ? new { s.Skill.Id, s.Skill.Name } : null,
                    HostProfileId = s.HostProfileId,
                    HostDisplayName = s.HostProfile != null
                        ? (s.HostProfile.DisplayName != null
                            ? s.HostProfile.DisplayName
                            : (s.HostProfile.User != null ? s.HostProfile.User.UserName : null))
                        : null,
                    s.ScheduledAt,
                    s.DurationMinutes,
                    s.IsOpen
                })
                .ToListAsync();

            return Ok(sessions);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var s = await _db.Sessions
                .Include(x => x.Skill)
                .Include(x => x.HostProfile)
                .Include(x => x.Requests)
                    .ThenInclude(r => r.RequesterProfile)
                .Where(x => x.Id == id)
                .Select(x => new
                {
                    x.Id,
                    x.Title,
                    x.Description,
                    Skill = x.Skill != null ? new { x.Skill.Id, x.Skill.Name } : null,
                    HostProfileId = x.HostProfileId,
                    HostDisplayName = x.HostProfile != null ? (x.HostProfile.DisplayName ?? x.HostProfile.User!.UserName) : null,
                    x.ScheduledAt,
                    x.DurationMinutes,
                    x.IsOpen,
                    Requests = x.Requests.Select(r => new { r.Id, r.RequesterProfileId, RequesterDisplayName = r.RequesterProfile != null ? r.RequesterProfile.DisplayName ?? r.RequesterProfile.User!.UserName : null, r.Message, r.Status, r.CreatedAt })
                })
                .FirstOrDefaultAsync();

            if (s == null) return NotFound();

            return Ok(s);
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateSessionDto dto)
        {
            if (!ModelState.IsValid) return ValidationProblem(ModelState);
            var userId = _userManager.GetUserId(User);
            var profile = await _db.Profiles.FirstOrDefaultAsync(p => p.UserId == userId);
            if (profile == null) return BadRequest("User must create a profile before creating sessions.");

            var session = new Session
            {
                Title = dto.Title,
                Description = dto.Description,
                SkillId = dto.SkillId,
                HostProfileId = profile.Id,
                ScheduledAt = dto.ScheduledAt ?? DateTime.UtcNow,
                DurationMinutes = dto.DurationMinutes,
                IsOpen = true
            };

            _db.Sessions.Add(session);
            await _db.SaveChangesAsync();
            // Return a lightweight DTO instead of the EF tracked entity to avoid JSON cycles
            var resultDto = new
            {
                session.Id,
                session.Title,
                session.Description,
                SkillId = session.SkillId,
                Skill = (object?)null,
                HostProfileId = session.HostProfileId,
                HostDisplayName = (string?)null,
                session.ScheduledAt,
                session.DurationMinutes,
                session.IsOpen
            };
            return CreatedAtAction(nameof(Get), new { id = session.Id }, resultDto);
        }

        [Authorize]
        [HttpPost("{id}/requests")]
        public async Task<IActionResult> RequestJoin(int id, [FromBody] CreateRequestDto dto)
        {
            var session = await _db.Sessions.FindAsync(id);
            if (session == null) return NotFound();
            if (!session.IsOpen) return BadRequest("Session is not open for requests.");

            var userId = _userManager.GetUserId(User);
            var profile = await _db.Profiles.FirstOrDefaultAsync(p => p.UserId == userId);
            if (profile == null) return BadRequest("User must have a profile to request a session.");

            var request = new SessionRequest
            {
                SessionId = session.Id,
                RequesterProfileId = profile.Id,
                Message = dto.Message,
                CreatedAt = DateTime.UtcNow,
                Status = "Pending"
            };

            _db.SessionRequests.Add(request);
            await _db.SaveChangesAsync();
            // Return a lightweight DTO to avoid serialization of full navigation graph
            return Ok(new { request.Id, request.SessionId, request.RequesterProfileId, request.Message, request.Status, request.CreatedAt });
        }

        [Authorize]
        [HttpPost("requests/{requestId}/respond")]
        public async Task<IActionResult> RespondToRequest(int requestId, [FromBody] RespondDto dto)
        {
            var request = await _db.SessionRequests
                .Include(r => r.Session)
                .FirstOrDefaultAsync(r => r.Id == requestId);

            if (request == null) return NotFound();

            var userId = _userManager.GetUserId(User);
            // Ensure current user is host of the session
            var hostProfile = await _db.Profiles.FirstOrDefaultAsync(p => p.UserId == userId);
            if (hostProfile == null || request.Session == null || request.Session.HostProfileId != hostProfile.Id)
            {
                return Forbid();
            }

            if (dto.Accept)
            {
                request.Status = "Accepted";
                // Optionally close session to further requests
                request.Session.IsOpen = false;
            }
            else
            {
                request.Status = "Rejected";
            }

            await _db.SaveChangesAsync();
            // Return lightweight DTO to avoid serializing navigation properties (which can cause cycles)
            return Ok(new { request.Id, request.SessionId, request.RequesterProfileId, request.Message, request.Status, request.CreatedAt });
        }

        // DTOs
        public class CreateSessionDto
        {
            [System.ComponentModel.DataAnnotations.Required]
            public string Title { get; set; } = string.Empty;
            public string? Description { get; set; }
            public int? SkillId { get; set; }
            [System.ComponentModel.DataAnnotations.Required]
            public DateTime? ScheduledAt { get; set; }
            [System.ComponentModel.DataAnnotations.Range(1, 600)]
            public int DurationMinutes { get; set; }
        }

        public class CreateRequestDto
        {
            public string? Message { get; set; }
        }

        public class RespondDto
        {
            public bool Accept { get; set; }
        }
    }
}
