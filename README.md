# SkillSwap - EF Core + Identity + JWT Authentication & Admin Panel

A complete full-stack authentication system with EF Core Entity Framework, ASP.NET Core Identity, JWT tokens, and an admin panel for user management.

## Project Structure

```
Backend/
  Backend/
    Controllers/
      AuthController.cs          # Login/Register endpoints
      AdminController.cs         # Admin user management endpoints (admin only)
      DTOs/
        RegisterRequest.cs
        LoginRequest.cs
        ToggleRoleRequest.cs
    Data/
      ApplicationDbContext.cs    # EF Core DbContext with Identity
      StartupSeeder.cs          # Seed admin user on startup
    Models/
      ApplicationUser.cs        # Custom Identity user model
    Program.cs                  # Configuration & middleware setup
    appsettings.json            # Config with JWT and DB settings
    appsettings.Development.json

Frontend/
  src/
    services/
      auth.ts                   # Auth service (login, register, JWT decode, currentUser)
      admin.ts                  # Admin API service (user management)
    pages/
      Login.tsx                 # Login form
      Register.tsx              # Registration form
      AdminPanel.tsx            # Admin user management UI
    App.tsx                     # Main app with routing
```

## Setup & Run Locally

### Backend

1. **Install .NET 9 SDK** (if not already installed)
   ```bash
   # macOS with Homebrew
   brew install dotnet
   ```

2. **Navigate to backend folder**
   ```bash
   cd Backend/Backend
   ```

3. **Restore packages and build**
   ```bash
   dotnet restore
   dotnet build
   ```

4. **Run migrations (if needed)**
   ```bash
   # Install dotnet-ef if not already present
   dotnet tool install --global dotnet-ef --version 8.0.0
   
   # Create and apply migrations
   /Users/aj/.dotnet/tools/dotnet-ef migrations add InitialCreate -o Migrations
   /Users/aj/.dotnet/tools/dotnet-ef database update
   ```

5. **Start the backend**
   ```bash
   dotnet run
   ```
   - Backend runs on `http://localhost:5188` (or the port configured in `Properties/launchSettings.json`)
   - Migrations are applied automatically on startup
   - Admin user is seeded on first run (dev: username `admin`, password `Admin123!`)

### Frontend

1. **Navigate to frontend folder**
   ```bash
   cd Frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   - Frontend runs on `http://localhost:5173` (Vite default)
   - If backend is on a different port, set `VITE_API_URL` environment variable:
     ```bash
     VITE_API_URL=http://localhost:5188/api npm run dev
     ```

## Authentication Flow

### Login/Register
1. User submits credentials via Login or Register form
2. Backend validates and creates Identity user (or signs in existing)
3. Backend returns JWT token (signed with secret in `appsettings.json`)
4. Frontend stores JWT in `localStorage` (key: `jwt`)
5. All subsequent API calls include JWT in `Authorization: Bearer <token>` header

### JWT Token
- **Algorithm**: HS256 (HMAC SHA-256)
- **Default expiry**: 60 minutes
- **Signing key**: Read from `JWT_KEY` env var (Production) or `appsettings.json` (Development)
- **Payload includes**:
  - `sub` / `nameid`: User ID
  - `unique_name`: Username
  - `role`: Array of role strings (e.g., `["Admin"]`)
  - Standard JWT claims: `iss`, `aud`, `exp`

## Admin Panel

### Access
- **Who can see it**: Only users in the `Admin` role
- **URL**: http://localhost:5173 → click "Admin Panel" button in header (only visible to admins)

### Features
1. **View all users** - Table showing all users with:
   - Username, Email, Display Name
   - Admin status (checkbox)
   - Email confirmed status

2. **Add new users** - Modal form to create users with:
   - Username, Email, Password, Display Name
   - Users created with no roles (not admin by default)

3. **Toggle admin status** - Checkbox next to each user
   - Check to promote user to Admin
   - Uncheck to remove Admin role

4. **Delete users** - Delete button for each user
   - Confirmation required
   - Deleted user cannot log in

### Endpoints (Backend)

All endpoints require `[Authorize(Roles = "Admin")]`:

```
GET    /api/admin/users                    # List all users with roles
POST   /api/admin/users                    # Add new user
DELETE /api/admin/users/{id}               # Delete user
PATCH  /api/admin/users/{id}/role          # Toggle admin role
```

## Configuration

### `appsettings.json` / `appsettings.Development.json`

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=app.db"
  },
  "Jwt": {
    "Key": "ReplaceThisWithAStrongKeyForProduction",
    "Issuer": "bpa-skillswap",
    "Audience": "bpa-skillswap-audience",
    "ExpireMinutes": 60
  },
  "Admin": {
    "Email": "admin@local",
    "Password": "Admin123!"
  }
}
```

### Environment Variables (Production)

Set these before running the backend in Production:

```bash
# Required for JWT signing
export JWT_KEY="your-very-long-secure-random-key-at-least-256-bits"

# Optional: override admin credentials
export ADMIN_EMAIL="admin@example.com"
export ADMIN_PASSWORD="SuperSecure123!@"

# Optional: backend will auto-apply migrations on startup
```

### Password Requirements (Identity)

Production defaults (hardened):
- Minimum 8 characters
- Must include uppercase letter (A-Z)
- Must include lowercase letter (a-z)
- Must include digit (0-9)
- Must include special character (!@#$%^&*)
- Account lockout after 5 failed attempts for 15 minutes
- Email must be unique

Development defaults (looser for testing):
- If `JWT_KEY` and `ADMIN_PASSWORD` not set, dev defaults apply
- Admin seeding falls back to `Admin123!` in Development only

## How It All Works Together

### Backend Authentication Flow
1. **Program.cs** configures:
   - DbContext with SQLite (or your DB)
   - Identity with password policies
   - JWT bearer authentication
   - StartupSeeder to auto-create admin user

2. **AuthController** (/api/auth):
   - `POST /register` - Create new Identity user
   - `POST /login` - Validate credentials, return JWT

3. **AdminController** (/api/admin):
   - `GET /users` - List all users (requires Admin role)
   - `POST /users` - Create user (requires Admin role)
   - `DELETE /users/{id}` - Delete user (requires Admin role)
   - `PATCH /users/{id}/role` - Toggle admin role (requires Admin role)

4. **Middleware**:
   - `UseAuthentication()` - Validates JWT tokens
   - `UseAuthorization()` - Checks [Authorize] attributes and roles

### Frontend Flow
1. **auth.ts** exports:
   - `login(credentials)` - POST to /api/auth/login, store JWT
   - `register(data)` - POST to /api/auth/register
   - `getCurrentUser()` - Decode JWT to get user ID, username, roles
   - `isAdmin()` - Check if current user is Admin
   - `authFetch(url, options)` - Fetch helper that includes JWT header
   - `logout()` - Clear localStorage

2. **admin.ts** exports (uses authFetch):
   - `getAllUsers()` - Fetch all users
   - `addUser(data)` - Create user
   - `deleteUser(id)` - Delete user
   - `toggleAdminRole(id, isAdmin)` - Promote/demote user

3. **App.tsx**:
   - Conditionally show "Admin Panel" button if `isAdmin()`
   - Route to AdminPanel page if admin clicks button
   - Protect Admin Panel with role check

4. **AdminPanel.tsx**:
   - Lists users in table
   - Modal to add users
   - Inline admin checkbox toggle
   - Delete buttons with confirmation

## Security Notes

### Development
- JWT key: `ReplaceThisWithAStrongKeyForProduction` (obviously insecure)
- Admin credentials: hardcoded defaults for dev convenience
- SQLite used for simplicity

### Production Checklist
- [ ] Set strong `JWT_KEY` environment variable (min 256 bits / 32 bytes of entropy)
- [ ] Set strong `ADMIN_PASSWORD` environment variable
- [ ] Use a production-ready database (SQL Server, PostgreSQL, etc.)
- [ ] Enable HTTPS (handled by `UseHsts()` + `UseHttpsRedirection()` in Program.cs)
- [ ] Store secrets in a vault (Azure Key Vault, AWS Secrets Manager, Vault, etc.)
- [ ] Implement refresh token rotation and token revocation
- [ ] Consider storing tokens in HttpOnly cookies if XSS is a concern
- [ ] Add rate limiting to login/register endpoints
- [ ] Log authentication/authorization failures
- [ ] Regularly rotate signing keys
- [ ] Update dependencies frequently

### Common Issues

**JWT decode fails / user not found after login**
- Ensure the JWT_KEY in Backend matches. If key changes, old tokens are invalid.
- Clear localStorage on frontend if JWT doesn't decode: `localStorage.clear()`

**Admin panel shows "Access denied"**
- User must have `Admin` role in database
- Check that user was created with `toggleAdminRole()` after creation, or is the seeded admin
- JWT must be valid (not expired)

**CORS errors when calling admin endpoints**
- Frontend URL must be in Backend CORS policy (default: http://localhost:5173)
- Update `Program.cs` if frontend runs on different port

## Example Workflow

1. **Start backend** (creates admin user if first run):
   ```bash
   cd Backend/Backend && dotnet run
   ```

2. **Start frontend**:
   ```bash
   cd Frontend && npm run dev
   ```

3. **Register a test user**:
   - Go to http://localhost:5173
   - Click "Register"
   - Fill in username, email, strong password (8+ chars, upper, lower, digit, symbol)
   - Submit

4. **Login as admin**:
   - Click "Login"
   - Username: `admin`
   - Password: `Admin123!` (or your configured ADMIN_PASSWORD)
   - Submit

5. **Access admin panel**:
   - You'll see "Admin Panel" button in header
   - Click it to view user management
   - Add the test user you created to Admin role
   - Logout, login as test user, click Admin Panel to verify roles work

6. **Test user deletion**:
   - As admin, find test user, click Delete
   - Test user can no longer login

## Next Steps

- Add refresh tokens for better security
- Implement password reset flow
- Add email confirmation
- Add two-factor authentication (2FA)
- Add audit logging for admin actions
- Implement role-based UI (hide features based on roles)
- Add user profile/settings page
- Integrate with external auth (Google, GitHub, etc.)
