using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace bpa_skillswap_v04.Models
{
    public class Profile
    {
        public int Id { get; set; }

        // Link to Identity user
        public string UserId { get; set; } = string.Empty;
        public ApplicationUser? User { get; set; }

        // Public profile fields
        public string? Bio { get; set; }
        public string? Location { get; set; }
        public string? DisplayName { get; set; }

        // Skills the user offers
        public ICollection<Skill> SkillsOffered { get; set; } = new List<Skill>();

        // Skills the user wants to learn / is seeking
        public ICollection<Skill> SkillsWanted { get; set; } = new List<Skill>();

        // Optional availability / contact info
        public string? Availability { get; set; }
        public string? Contact { get; set; }
    }
}
