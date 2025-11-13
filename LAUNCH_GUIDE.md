# 🚀 SkillSwap - Complete Launch Guide

Everything is ready to launch! Follow these steps to get the full system running.

## Pre-Launch Checklist

- ✅ Backend: Entity Framework Core + ASP.NET Identity configured
- ✅ Frontend: React + Tailwind UI with authentication flows
- ✅ Database: SQLite with migrations and seeding
- ✅ JWT Authentication: Token generation with role claims
- ✅ Admin Panel: Full user management interface
- ✅ Role-Based Access Control: Admin-only endpoints secured

## Quick Start (5 minutes)

### Option 1: Two Terminal Windows (Recommended)

**Terminal 1 - Backend:**
```bash
cd /Users/aj/Documents/GitHub/bpa-skillswap-v04/Backend/Backend
dotnet run
```
Wait for: `Now listening on: http://localhost:5188`

**Terminal 2 - Frontend:**
```bash
cd /Users/aj/Documents/GitHub/bpa-skillswap-v04/Frontend
npm run dev
```
Wait for: `VITE v... ready in ... ms` and open http://localhost:5173

### Option 2: One Terminal with Background Process

```bash
# Start backend in background
cd /Users/aj/Documents/GitHub/bpa-skillswap-v04/Backend/Backend
dotnet run &

# Wait ~3 seconds for backend to start
sleep 3

# Start frontend
cd /Users/aj/Documents/GitHub/bpa-skillswap-v04/Frontend
npm run dev
```

## First Time Setup (Only if database doesn't exist)

The backend automatically:
1. ✅ Creates SQLite database (`app.db`)
2. ✅ Applies all migrations
3. ✅ Seeds admin user with credentials:
   - **Username:** `admin`
   - **Password:** `Admin123!`

If you get a stale database error:
```bash
# Delete old database
rm -f /Users/aj/Documents/GitHub/bpa-skillswap-v04/Backend/Backend/app.db*
# Restart backend - it will recreate from scratch
```

## Testing the System

### 1. Test Login
1. Go to http://localhost:5173
2. Click **"Login"**
3. Enter:
   - Username: `admin`
   - Password: `Admin123!`
4. ✅ Should see "Welcome" page with "You have admin access." message
5. ✅ Should see **"Admin Panel"** button in navbar (purple, bold)

### 2. Test Admin Panel
1. Click **"Admin Panel"** button
2. ✅ Should see table with all users
3. Test features:
   - **Add User**: Click "Add User" button, fill form, submit
   - **Delete User**: Click "Delete" on any user, confirm
   - **Toggle Admin**: Check/uncheck "Admin" checkbox for any user

### 3. Test Registration
1. Click **"Register"** from login page
2. Fill form with:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `TestPass123!` (must meet strength requirements)
   - Display Name: (optional)
3. ✅ Should redirect to home page after success
4. Go to Admin Panel
5. ✅ Should see your new user in the table

### 4. Test Role-Based Access
1. Create a new user via Admin Panel (leave unchecked for admin)
2. Logout (click "Logout")
3. Login as the new user
4. ✅ "Admin Panel" button should NOT be visible
5. Try accessing admin panel directly: http://localhost:5173 (will show "Access denied")

## Architecture Overview

### Backend Stack
- **Framework**: ASP.NET Core 9
- **Database**: Entity Framework Core 8 + SQLite
- **Authentication**: ASP.NET Core Identity + JWT
- **API**: RESTful endpoints with role-based authorization

### Frontend Stack
- **Framework**: React 19 + TypeScript
- **Styling**: Tailwind CSS 4
- **Build**: Vite
- **State Management**: React hooks (useState, useEffect)

## Key Endpoints

### Public Endpoints
```
POST   /api/auth/register          # Create new user
POST   /api/auth/login             # Login & get JWT token
```

### Protected Endpoints (Requires JWT)
```
GET    /api/admin/users            # List all users [Admin]
POST   /api/admin/users            # Create user [Admin]
DELETE /api/admin/users/{id}       # Delete user [Admin]
PATCH  /api/admin/users/{id}/role  # Toggle admin role [Admin]
GET    /me                         # Get current user [Authenticated]
```

## File Structure

```
Backend/Backend/
├── Controllers/
│   ├── AuthController.cs          # Login/register endpoints
│   ├── AdminController.cs         # User management (admin only)
│   └── DTOs/
│       ├── RegisterRequest.cs
│       ├── LoginRequest.cs
│       └── ToggleRoleRequest.cs
├── Data/
│   ├── ApplicationDbContext.cs    # EF Core context
│   ├── StartupSeeder.cs           # Auto-seed admin user
│   └── Migrations/                # EF migrations
├── Models/
│   └── ApplicationUser.cs         # Identity user model
├── Program.cs                     # App configuration
└── app.db                         # SQLite database (auto-created)

Frontend/src/
├── pages/
│   ├── Login.tsx                  # Login form
│   ├── Register.tsx               # Registration form
│   └── AdminPanel.tsx             # User management UI
├── services/
│   ├── auth.ts                    # Auth logic & JWT handling
│   └── admin.ts                   # Admin API calls
├── App.tsx                        # Main app & routing
└── main.tsx                       # Entry point
```

## Configuration

### Backend Settings (`appsettings.json`)
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
  }
}
```

### Frontend Settings
- API URL: `http://localhost:5188/api` (or set `VITE_API_URL` env var)
- JWT stored in: `localStorage` (key: `jwt`)

## Troubleshooting

### Backend won't start
```bash
# Check if port 5188 is in use
lsof -i :5188

# Kill process if needed
kill -9 <PID>

# Or change port in Properties/launchSettings.json
```

### Frontend can't connect to backend
- Ensure backend is running on 5188
- Check CORS is enabled (should be by default for localhost:5173)
- Clear browser cache (Ctrl+Shift+Delete)
- Check browser console for errors (F12)

### Admin Panel button not showing
1. Check browser console for role information
2. Look for: `roles: ["Admin"]` in decoded JWT
3. If empty: delete database and restart backend
   ```bash
   rm -f Backend/Backend/app.db*
   cd Backend/Backend && dotnet run
   ```

### Can't login
- Verify username/password spelling
- Admin credentials: `admin` / `Admin123!`
- Check backend console for error messages
- Try recreating database (see above)

## Production Deployment Checklist

Before deploying to production, ensure:

- [ ] Change `Jwt:Key` to a strong random string (32+ characters)
- [ ] Set `ADMIN_PASSWORD` environment variable securely
- [ ] Switch to production database (SQL Server or PostgreSQL)
- [ ] Update CORS origins to match your domain
- [ ] Enable HTTPS and set secure headers
- [ ] Configure environment-based secrets (not in source code)
- [ ] Enable logging and monitoring
- [ ] Implement rate limiting on auth endpoints
- [ ] Set up database backups
- [ ] Test all endpoints with real-world scenarios
- [ ] Update `appsettings.Production.json`

## Performance Notes

- JWT tokens are cached in browser `localStorage`
- Role checks are done client-side (from JWT payload)
- Each API call includes JWT in Authorization header
- Admin operations require backend role verification
- Database queries are efficient with proper indexing

## Next Steps

1. ✅ **Launch the system** (follow Quick Start above)
2. 📝 **Test all flows** (see Testing the System section)
3. 🔒 **Secure for production** (see Production Checklist)
4. 🚀 **Deploy to cloud** (AWS, Azure, Heroku, etc.)

## Support & Debugging

### Enable Verbose Logging
Add to `Program.cs`:
```csharp
if (app.Environment.IsDevelopment())
{
    app.Logger.LogInformation("Starting in Development mode");
}
```

### Monitor Database
```bash
# View database contents (requires sqlite3)
sqlite3 Backend/Backend/app.db ".tables"
sqlite3 Backend/Backend/app.db "SELECT * FROM AspNetUsers;"
```

### Test API Directly
```bash
# Test login
curl -X POST http://localhost:5188/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"UserName":"admin","Password":"Admin123!"}'

# Test admin endpoint (with JWT token)
curl -X GET http://localhost:5188/api/admin/users \
  -H "Authorization: Bearer <TOKEN_HERE>"
```

---

**You're all set! 🎉 Follow the Quick Start section above to launch the system.**
