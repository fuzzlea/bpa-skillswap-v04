namespace bpa_skillswap_v04.Controllers.DTOs
{
    public class RegisterRequest
    {
        public string UserName { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
        public string? DisplayName { get; set; }
    }
}
