using System;

namespace bpa_skillswap_v04.Models
{
    public class SessionRequest
    {
        public int Id { get; set; }

        public int SessionId { get; set; }
        public Session? Session { get; set; }

        public int RequesterProfileId { get; set; }
        public Profile? RequesterProfile { get; set; }

        public string? Message { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Pending, Accepted, Rejected
        public string Status { get; set; } = "Pending";

        // Attendance tracking - only relevant after session completion
        public bool HasAttended { get; set; } = false;
        public DateTime? VerifiedAt { get; set; } = null;
    }
}
