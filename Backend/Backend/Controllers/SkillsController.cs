using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using bpa_skillswap_v04.Data;

namespace bpa_skillswap_v04.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SkillsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        public SkillsController(ApplicationDbContext db) => _db = db;

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var skills = await _db.Skills.OrderBy(s => s.Name).ToListAsync();
            return Ok(skills);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var skill = await _db.Skills.FindAsync(id);
            if (skill == null) return NotFound();
            return Ok(skill);
        }
    }
}
