using System;
using System.Collections.Generic;

namespace bpa_skillswap_v04.Models
{
    public class Session
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }

        // Optional associated skill
        public int? SkillId { get; set; }
        public Skill? Skill { get; set; }

        // Host profile
        public int HostProfileId { get; set; }
        public Profile? HostProfile { get; set; }

        // Scheduling
        public DateTime ScheduledAt { get; set; }
        public int DurationMinutes { get; set; }

        // Whether the session is open for requests
        public bool IsOpen { get; set; } = true;

        // Requests for this session
        public ICollection<SessionRequest> Requests { get; set; } = new List<SessionRequest>();
    }
}
