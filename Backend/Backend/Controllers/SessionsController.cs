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

        [HttpGet("profile/{profileId}/active")]
        public async Task<IActionResult> GetActiveSessions(int profileId)
        {
            var sessions = await _db.Sessions
                .Where(s => s.HostProfileId == profileId && s.IsOpen)
                .Include(s => s.Skill)
                .Include(s => s.HostProfile)
                .Select(s => new
                {
                    s.Id,
                    s.Title,
                    s.Description,
                    Skill = s.Skill != null ? new { s.Skill.Id, s.Skill.Name } : null,
                    s.HostProfileId,
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

        [Authorize]
        [HttpGet("my-participations")]
        public async Task<IActionResult> GetMyParticipations()
        {
            var userId = _userManager.GetUserId(User);
            var userProfile = await _db.Profiles.FirstOrDefaultAsync(p => p.UserId == userId);
            if (userProfile == null) return BadRequest("User has no profile");

            var participations = await _db.SessionRequests
                .Where(r => r.RequesterProfileId == userProfile.Id && (r.Status == "Accepted" || r.Status == "Pending"))
                .Include(r => r.Session)
                .ThenInclude(s => s.Skill)
                .Include(r => r.Session)
                .ThenInclude(s => s.HostProfile)
                .Select(r => new
                {
                    RequestId = r.Id,
                    SessionId = r.Session.Id,
                    r.Session.Title,
                    r.Session.Description,
                    r.Session.HostProfileId,
                    HostDisplayName = r.Session.HostProfile != null
                        ? (r.Session.HostProfile.DisplayName != null
                            ? r.Session.HostProfile.DisplayName
                            : (r.Session.HostProfile.User != null ? r.Session.HostProfile.User.UserName : null))
                        : null,
                    Skill = r.Session.Skill != null ? new { r.Session.Skill.Id, r.Session.Skill.Name } : null,
                    r.Session.ScheduledAt,
                    r.Session.DurationMinutes,
                    r.Status
                })
                .ToListAsync();

            return Ok(participations);
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

            // Create notifications for users whose Wants match this skill
            var usersWantingSkill = await _db.Profiles
                .Where(p => p.SkillsWanted.Any(s => s.Id == dto.SkillId))
                .Include(p => p.User)
                .ToListAsync();

            foreach (var targetProfile in usersWantingSkill)
            {
                var notification = new Notification
                {
                    UserId = targetProfile.UserId,
                    Type = "SessionCreated",
                    Title = "New Session Available",
                    Content = $"{profile.DisplayName ?? profile.User?.UserName} created a session for {(await _db.Skills.FindAsync(dto.SkillId))?.Name}",
                    RelatedSessionId = session.Id,
                    CreatedAt = DateTime.UtcNow,
                    IsRead = false
                };
                _db.Notifications.Add(notification);
            }
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
            var session = await _db.Sessions.Include(s => s.HostProfile).FirstOrDefaultAsync(s => s.Id == id);
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

            // Create notification for session host
            var hostNotification = new Notification
            {
                UserId = session.HostProfile!.UserId,
                Type = "JoinRequest",
                Title = "New Join Request",
                Content = $"{profile.DisplayName ?? profile.User?.UserName} requested to join your session '{session.Title}'",
                RelatedSessionId = session.Id,
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };
            _db.Notifications.Add(hostNotification);
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
                .Include(r => r.RequesterProfile)
                .ThenInclude(p => p!.User)
                .FirstOrDefaultAsync(r => r.Id == requestId);

            if (request == null) return NotFound();

            var userId = _userManager.GetUserId(User);
            // Ensure current user is host of the session
            var hostProfile = await _db.Profiles.Include(p => p.User).FirstOrDefaultAsync(p => p.UserId == userId);
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

            // Create notification for requester about the response
            if (request.RequesterProfile?.User != null)
            {
                var notificationType = dto.Accept ? "RequestAccepted" : "RequestRejected";
                var notificationTitle = dto.Accept ? "Request Accepted" : "Request Denied";
                var messageContent = dto.Accept
                    ? $"{hostProfile.DisplayName ?? hostProfile.User?.UserName} accepted your request to join '{request.Session.Title}'"
                    : $"{hostProfile.DisplayName ?? hostProfile.User?.UserName} denied your request to join '{request.Session.Title}'";

                if (!string.IsNullOrWhiteSpace(dto.Message))
                {
                    messageContent += $": {dto.Message}";
                }

                var notification = new Notification
                {
                    UserId = request.RequesterProfile.UserId,
                    Type = notificationType,
                    Title = notificationTitle,
                    Content = messageContent,
                    RelatedSessionId = request.SessionId,
                    CreatedAt = DateTime.UtcNow,
                    IsRead = false
                };
                _db.Notifications.Add(notification);
                await _db.SaveChangesAsync();
            }

            // Return lightweight DTO to avoid serializing navigation properties (which can cause cycles)
            return Ok(new { request.Id, request.SessionId, request.RequesterProfileId, request.Message, request.Status, request.CreatedAt });
        }

        // GET: api/sessions/requests/pending
        [Authorize]
        [HttpGet("requests/pending")]
        public async Task<IActionResult> GetPendingRequests()
        {
            var userId = _userManager.GetUserId(User);
            var hostProfile = await _db.Profiles.FirstOrDefaultAsync(p => p.UserId == userId);
            if (hostProfile == null) return BadRequest("User must have a profile");

            // Get all requests for sessions hosted by current user
            var requests = await _db.SessionRequests
                .Include(r => r.Session)
                .Include(r => r.RequesterProfile)
                .Where(r => r.Session!.HostProfileId == hostProfile.Id)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    r.Id,
                    r.SessionId,
                    SessionTitle = r.Session!.Title,
                    r.RequesterProfileId,
                    RequesterDisplayName = r.RequesterProfile != null
                        ? (r.RequesterProfile.DisplayName ?? r.RequesterProfile.User!.UserName)
                        : "Unknown",
                    r.Message,
                    r.Status,
                    r.CreatedAt
                })
                .ToListAsync();

            return Ok(requests);
        }

        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateSessionDto dto)
        {
            if (!ModelState.IsValid) return ValidationProblem(ModelState);

            var session = await _db.Sessions.FindAsync(id);
            if (session == null) return NotFound();

            var userId = _userManager.GetUserId(User);
            var hostProfile = await _db.Profiles.FirstOrDefaultAsync(p => p.UserId == userId);
            if (hostProfile == null || session.HostProfileId != hostProfile.Id)
            {
                return Forbid("You can only edit sessions you created.");
            }

            // Update fields
            session.Title = dto.Title ?? session.Title;
            session.Description = dto.Description ?? session.Description;
            if (dto.SkillId.HasValue)
                session.SkillId = dto.SkillId;
            if (dto.ScheduledAt.HasValue)
                session.ScheduledAt = dto.ScheduledAt.Value;
            if (dto.DurationMinutes.HasValue)
                session.DurationMinutes = dto.DurationMinutes.Value;
            if (dto.IsOpen.HasValue)
                session.IsOpen = dto.IsOpen.Value;

            await _db.SaveChangesAsync();

            // Return lightweight DTO to avoid cycles
            return Ok(new
            {
                session.Id,
                session.Title,
                session.Description,
                SkillId = session.SkillId,
                session.ScheduledAt,
                session.DurationMinutes,
                session.IsOpen
            });
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var session = await _db.Sessions.FindAsync(id);
                if (session == null) return NotFound();

                var userId = _userManager.GetUserId(User);
                var hostProfile = await _db.Profiles.FirstOrDefaultAsync(p => p.UserId == userId);
                if (hostProfile == null || session.HostProfileId != hostProfile.Id)
                {
                    return Forbid("You can only delete sessions you created.");
                }

                // Delete related session requests first
                var relatedRequests = await _db.SessionRequests.Where(r => r.SessionId == id).ToListAsync();
                _db.SessionRequests.RemoveRange(relatedRequests);

                // Delete related ratings pointing to this session
                var relatedRatings = await _db.Ratings.Where(r => r.SessionId == id).ToListAsync();
                _db.Ratings.RemoveRange(relatedRatings);

                // Delete related notifications pointing to this session
                var relatedNotifications = await _db.Notifications.Where(n => n.RelatedSessionId == id).ToListAsync();
                _db.Notifications.RemoveRange(relatedNotifications);

                _db.Sessions.Remove(session);
                await _db.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error deleting session {id}: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { error = ex.Message, stackTrace = ex.StackTrace });
            }
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

        public class UpdateSessionDto
        {
            public string? Title { get; set; }
            public string? Description { get; set; }
            public int? SkillId { get; set; }
            public DateTime? ScheduledAt { get; set; }
            public int? DurationMinutes { get; set; }
            public bool? IsOpen { get; set; }
        }

        public class CreateRequestDto
        {
            public string? Message { get; set; }
        }

        public class RespondDto
        {
            public bool Accept { get; set; }
            public string? Message { get; set; } // Optional message with acceptance/rejection
        }
    }
}
