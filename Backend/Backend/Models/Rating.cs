using System;

namespace bpa_skillswap_v04.Models
{
    public class Rating
    {
        public int Id { get; set; }

        public int? SessionId { get; set; }
        public Session? Session { get; set; }

        public int RaterProfileId { get; set; }
        public Profile? RaterProfile { get; set; }

        public int TargetProfileId { get; set; }
        public Profile? TargetProfile { get; set; }

        public int Score { get; set; } // 1-5
        public string? Comment { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
