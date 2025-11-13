using Microsoft.AspNetCore.Identity;

namespace bpa_skillswap_v04.Models
{
    public class ApplicationUser : IdentityUser
    {
        // Extend with additional profile properties as needed
        public string? DisplayName { get; set; }
    }
}
