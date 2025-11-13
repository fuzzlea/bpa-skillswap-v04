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
    public class RatingsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly UserManager<ApplicationUser> _userManager;

        public RatingsController(ApplicationDbContext db, UserManager<ApplicationUser> userManager)
        {
            _db = db;
            _userManager = userManager;
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> Submit([FromBody] SubmitRatingDto dto)
        {
            if (!ModelState.IsValid) return ValidationProblem(ModelState);

            var userId = _userManager.GetUserId(User);
            var raterProfile = await _db.Profiles.FirstOrDefaultAsync(p => p.UserId == userId);
            if (raterProfile == null) return BadRequest("Current user must have a profile to submit ratings.");

            // Ensure session exists
            var session = await _db.Sessions.Include(s => s.Requests).FirstOrDefaultAsync(s => s.Id == dto.SessionId);
            if (session == null) return NotFound("Session not found.");

            // Ensure rater participated: either host or accepted requester
            var isHost = session.HostProfileId == raterProfile.Id;
            var wasAccepted = await _db.SessionRequests.AnyAsync(r => r.SessionId == dto.SessionId && r.RequesterProfileId == raterProfile.Id && r.Status == "Accepted");
            if (!isHost && !wasAccepted) return Forbid();

            // Ensure target profile is participant in session (host or accepted requester)
            var targetIsHost = session.HostProfileId == dto.TargetProfileId;
            var targetWasAccepted = await _db.SessionRequests.AnyAsync(r => r.SessionId == dto.SessionId && r.RequesterProfileId == dto.TargetProfileId && r.Status == "Accepted");
            if (!targetIsHost && !targetWasAccepted) return BadRequest("Target profile did not participate in the session.");

            var rating = new Rating
            {
                SessionId = dto.SessionId,
                RaterProfileId = raterProfile.Id,
                TargetProfileId = dto.TargetProfileId,
                Score = dto.Score,
                Comment = dto.Comment
            };

            _db.Ratings.Add(rating);
            await _db.SaveChangesAsync();
            // Return lightweight DTO to avoid EF navigation serialization cycles
            return Ok(new { rating.Id, rating.SessionId, rating.RaterProfileId, rating.TargetProfileId, rating.Score, rating.Comment, rating.CreatedAt });
        }

        [HttpGet("profile/{profileId}")]
        public async Task<IActionResult> GetForProfile(int profileId)
        {
            var ratings = await _db.Ratings
                .Where(r => r.TargetProfileId == profileId)
                .Include(r => r.RaterProfile)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
            return Ok(ratings);
        }

        [HttpGet("profile/{profileId}/average")]
        public async Task<IActionResult> GetAverage(int profileId)
        {
            var avg = await _db.Ratings.Where(r => r.TargetProfileId == profileId).AverageAsync(r => (double?)r.Score);
            return Ok(new { average = avg ?? 0.0 });
        }

        public class SubmitRatingDto
        {
            [System.ComponentModel.DataAnnotations.Required]
            public int SessionId { get; set; }
            [System.ComponentModel.DataAnnotations.Required]
            public int TargetProfileId { get; set; }
            [System.ComponentModel.DataAnnotations.Range(1, 5)]
            public int Score { get; set; }
            public string? Comment { get; set; }
        }
    }
}
