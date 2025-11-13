using System.Collections.Generic;

namespace bpa_skillswap_v04.Models
{
    public class Skill
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;

        // Navigation for profiles that offer this skill
        public ICollection<Profile> OfferedBy { get; set; } = new List<Profile>();

        // Navigation for profiles that want this skill
        public ICollection<Profile> WantedBy { get; set; } = new List<Profile>();
    }
}
