using System;
using System.ComponentModel.DataAnnotations;

namespace bpa_skillswap_v04.Models
{
    public class Notification
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; } = string.Empty;

        public ApplicationUser? User { get; set; }

        [Required]
        public string Type { get; set; } = string.Empty; // "SessionCreated", "JoinRequest", "Rating"

        [Required]
        public string Title { get; set; } = string.Empty;

        public string? Content { get; set; }

        public int? RelatedSessionId { get; set; }

        public int? RelatedProfileId { get; set; }

        public int? RelatedRatingId { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Required]
        public bool IsRead { get; set; } = false;
    }
}
