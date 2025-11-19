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
    [Route("api/sessions/{sessionId}/management")]
    [Authorize]
    public class SessionManagementController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly UserManager<ApplicationUser> _userManager;

        public SessionManagementController(ApplicationDbContext db, UserManager<ApplicationUser> userManager)
        {
            _db = db;
            _userManager = userManager;
        }

        // Get session details for management (creator only)
        [HttpGet]
        public async Task<IActionResult> GetSessionManagement(int sessionId)
        {
            var session = await _db.Sessions
                .Include(s => s.HostProfile)
                .Include(s => s.Skill)
                .Include(s => s.Requests)
                    .ThenInclude(r => r.RequesterProfile)
                        .ThenInclude(p => p!.User)
                .FirstOrDefaultAsync(s => s.Id == sessionId);

            if (session == null) return NotFound("Session not found");

            // Check authorization - only creator can view management page
            var userId = _userManager.GetUserId(User);
            if (session.HostProfile?.UserId != userId)
            {
                return Forbid("You can only manage sessions you created");
            }

            var acceptedRequests = session.Requests.Where(r => r.Status == "Accepted").ToList();

            var result = new
            {
                session.Id,
                session.Title,
                session.Description,
                Skill = session.Skill != null ? new { session.Skill.Id, session.Skill.Name } : null,
                session.ScheduledAt,
                session.DurationMinutes,
                session.IsOpen,
                Attendees = acceptedRequests.Select(r => new
                {
                    r.Id,
                    r.RequesterProfileId,
                    AttendeeDisplayName = r.RequesterProfile?.DisplayName ?? r.RequesterProfile?.User?.UserName ?? "Unknown",
                    r.HasAttended,
                    r.VerifiedAt,
                    r.CreatedAt,
                    AttendeeUserId = r.RequesterProfile?.UserId
                }),
                TotalAttendees = acceptedRequests.Count,
                VerifiedAttendees = acceptedRequests.Count(r => r.HasAttended)
            };

            return Ok(result);
        }

        // Get list of attendees for session
        [HttpGet("attendees")]
        public async Task<IActionResult> GetAttendees(int sessionId)
        {
            var session = await _db.Sessions
                .Include(s => s.HostProfile)
                .Include(s => s.Requests)
                    .ThenInclude(r => r.RequesterProfile)
                        .ThenInclude(p => p!.User)
                .FirstOrDefaultAsync(s => s.Id == sessionId);

            if (session == null) return NotFound("Session not found");

            // Check authorization
            var userId = _userManager.GetUserId(User);
            if (session.HostProfile?.UserId != userId)
            {
                return Forbid("You can only manage sessions you created");
            }

            var attendees = session.Requests
                .Where(r => r.Status == "Accepted")
                .Select(r => new
                {
                    r.Id,
                    r.RequesterProfileId,
                    AttendeeDisplayName = r.RequesterProfile?.DisplayName ?? r.RequesterProfile?.User?.UserName ?? "Unknown",
                    AttendeeEmail = r.RequesterProfile?.User?.Email,
                    r.HasAttended,
                    r.VerifiedAt,
                    r.CreatedAt,
                    AttendeeUserId = r.RequesterProfile?.UserId
                })
                .ToList();

            return Ok(attendees);
        }

        // Verify attendance for an attendee
        [HttpPut("attendees/{sessionRequestId}/verify")]
        public async Task<IActionResult> VerifyAttendance(int sessionId, int sessionRequestId)
        {
            var session = await _db.Sessions
                .Include(s => s.HostProfile)
                .FirstOrDefaultAsync(s => s.Id == sessionId);

            if (session == null) return NotFound("Session not found");

            // Check authorization
            var userId = _userManager.GetUserId(User);
            if (session.HostProfile?.UserId != userId)
            {
                return Forbid("You can only manage sessions you created");
            }

            var request = await _db.SessionRequests.FirstOrDefaultAsync(r => r.Id == sessionRequestId && r.SessionId == sessionId);
            if (request == null) return NotFound("Attendee not found in this session");

            if (request.Status != "Accepted")
            {
                return BadRequest("Only accepted attendees can be verified");
            }

            request.HasAttended = true;
            request.VerifiedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new { request.Id, request.HasAttended, request.VerifiedAt });
        }

        // Unverify attendance (toggle)
        [HttpPut("attendees/{sessionRequestId}/unverify")]
        public async Task<IActionResult> UnverifyAttendance(int sessionId, int sessionRequestId)
        {
            var session = await _db.Sessions
                .Include(s => s.HostProfile)
                .FirstOrDefaultAsync(s => s.Id == sessionId);

            if (session == null) return NotFound("Session not found");

            // Check authorization
            var userId = _userManager.GetUserId(User);
            if (session.HostProfile?.UserId != userId)
            {
                return Forbid("You can only manage sessions you created");
            }

            var request = await _db.SessionRequests.FirstOrDefaultAsync(r => r.Id == sessionRequestId && r.SessionId == sessionId);
            if (request == null) return NotFound("Attendee not found in this session");

            request.HasAttended = false;
            request.VerifiedAt = null;
            await _db.SaveChangesAsync();

            return Ok(new { request.Id, request.HasAttended, request.VerifiedAt });
        }

        // Kick an attendee from session
        [HttpDelete("attendees/{sessionRequestId}")]
        public async Task<IActionResult> KickAttendee(int sessionId, int sessionRequestId)
        {
            var session = await _db.Sessions
                .Include(s => s.HostProfile)
                .FirstOrDefaultAsync(s => s.Id == sessionId);

            if (session == null) return NotFound("Session not found");

            // Check authorization
            var userId = _userManager.GetUserId(User);
            if (session.HostProfile?.UserId != userId)
            {
                return Forbid("You can only manage sessions you created");
            }

            var request = await _db.SessionRequests
                .Include(r => r.RequesterProfile)
                .FirstOrDefaultAsync(r => r.Id == sessionRequestId && r.SessionId == sessionId);

            if (request == null) return NotFound("Attendee not found in this session");

            if (request.Status != "Accepted")
            {
                return BadRequest("Only accepted attendees can be kicked");
            }

            // Change status to rejected
            request.Status = "Rejected";
            await _db.SaveChangesAsync();

            // Create notification for the removed attendee
            if (request.RequesterProfile?.UserId != null)
            {
                var hostProfile = session.HostProfile;
                var notification = new Notification
                {
                    UserId = request.RequesterProfile.UserId,
                    Type = "KickedFromSession",
                    Title = "Removed from Session",
                    Content = $"{hostProfile?.DisplayName ?? hostProfile?.User?.UserName} has removed you from the session '{session.Title}'",
                    RelatedSessionId = sessionId,
                    CreatedAt = DateTime.UtcNow,
                    IsRead = false
                };
                _db.Notifications.Add(notification);
                await _db.SaveChangesAsync();
            }

            return Ok(new { message = "Attendee removed from session", request.Id, request.Status });
        }

        // Start a conversation/message with an attendee
        [HttpPost("attendees/{sessionRequestId}/message")]
        public async Task<IActionResult> MessageAttendee(int sessionId, int sessionRequestId, [FromBody] SendMessageDto dto)
        {
            var session = await _db.Sessions
                .Include(s => s.HostProfile)
                .FirstOrDefaultAsync(s => s.Id == sessionId);

            if (session == null) return NotFound("Session not found");

            // Check authorization
            var userId = _userManager.GetUserId(User);
            if (session.HostProfile?.UserId != userId)
            {
                return Forbid("You can only message attendees of sessions you created");
            }

            var request = await _db.SessionRequests
                .Include(r => r.RequesterProfile)
                .FirstOrDefaultAsync(r => r.Id == sessionRequestId && r.SessionId == sessionId);

            if (request == null) return NotFound("Attendee not found");

            // For now, we'll return a message that indicates the user should use the messaging system
            // In a full implementation, this would create a conversation or send a message
            return Ok(new
            {
                message = "Message functionality ready",
                attendeeUserId = request.RequesterProfile?.UserId,
                attendeeDisplayName = request.RequesterProfile?.DisplayName ?? request.RequesterProfile?.User?.UserName,
                sessionTitle = session.Title
            });
        }

        // DTOs
        public class SendMessageDto
        {
            public string Message { get; set; } = string.Empty;
        }
    }
}
