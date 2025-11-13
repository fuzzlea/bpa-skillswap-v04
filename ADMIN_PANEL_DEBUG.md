# Admin Panel Debugging Guide

## Problem
The Admin Panel button isn't showing in the navbar after login, even though the user has the Admin role.

## Root Causes Investigated & Fixed
1. ✅ JWT wasn't including role claims from the backend
2. ✅ Frontend wasn't reactive - `isAdmin()` was called once during initial render
3. ✅ Role decoding logic needed improvement

## What I Changed

### Backend (AuthController.cs)
- `GenerateJwtToken()` now **includes all user roles** as `ClaimTypes.Role` claims in the JWT
- `/api/auth/login` now returns roles in the response for debugging

### Frontend
- App.tsx now uses **state** to track admin status and updates it after login
- Login service logs JWT and roles for debugging
- `getCurrentUser()` better handles role claim formats

## How to Test & Debug

### Step 1: Clear Everything
1. **Close the frontend dev server** (Ctrl+C in terminal)
2. **Clear browser cache**:
   - Open DevTools (F12)
   - Application → Local Storage → Clear All
   - Clear browser cache (Shift+Delete or DevTools)
3. **Restart the backend** (fresh start ensures seeder runs):
   ```bash
   cd Backend/Backend
   dotnet run
   ```

### Step 2: Start Frontend & Monitor Logs
1. **Start frontend**:
   ```bash
   cd Frontend
   npm run dev
   ```
2. **Open browser DevTools console** (F12 → Console tab)
   - Keep this open throughout testing

### Step 3: Test Login
1. **Go to http://localhost:5173**
2. **Click "Login"**
3. **Enter credentials**:
   - Username: `admin`
   - Password: `Admin123!`
4. **Check browser console** - you should see:
   ```
   Login response: { roles: ["Admin"], userName: "admin" }
   Decoded JWT: { ..., role: "Admin", ... }
   Current user: { id: "...", userName: "admin", roles: ["Admin"] }
   ```

### Step 4: Verify Admin Button
1. After successful login, you should see:
   - ✅ "Admin Panel" button in navbar (purple, bold)
   - ✅ "You have admin access." message on home page
2. Click "Admin Panel" button to view user management

## Expected Console Output

### After Successful Login:
```
Login response: {roles: Array(1), userName: 'admin'}
  roles: ["Admin"]
  userName: "admin"

Decoded JWT: {
  sub: "...",
  unique_name: "admin",
  nameid: "...",
  aud: "bpa-skillswap-audience",
  exp: 1731494400,
  iss: "bpa-skillswap",
  role: "Admin"  ← THIS is critical!
}

Current user: {
  id: "...",
  userName: "admin",
  roles: ["Admin"]
}
```

## Troubleshooting

### Console shows roles in response but NOT in JWT
**Cause**: JWT generation is failing to include roles from database
**Fix**: 
1. Check database has admin user with Admin role assigned
2. Try deleting `app.db` and letting seeder recreate it
3. Or manually assign role via admin panel

### Console shows role is "undefined" in decoded JWT
**Cause**: JWT signing key changed or token format incompatible
**Fix**:
1. Clear localStorage: `localStorage.clear()` in console
2. Logout and login again
3. If persists, restart backend

### Admin Panel shows "Access denied"
**Cause**: Either:
- User doesn't actually have Admin role in database
- JWT expired (default 60 min)
- Role claim isn't being recognized by backend

**Fix**:
1. Check console for current user roles
2. Go to admin panel with different admin user if available
3. Or delete user and recreate with admin role

## Quick Manual Test in Browser Console

```javascript
// Check what's in localStorage
JSON.parse(atob(localStorage.getItem('jwt').split('.')[1]))

// Should show:
// { ..., role: "Admin", ... }
```

## If Still Not Working

1. **Check backend logs** - watch for errors when generating JWT
2. **Test the API directly**:
   ```bash
   curl -X POST http://localhost:5188/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"UserName":"admin","Password":"Admin123!"}'
   
   # Should return:
   # {"token":"eyJ...","roles":["Admin"],"userName":"admin"}
   ```
3. **Verify database**:
   - Check if admin user exists
   - Check if admin user has Admin role assigned
4. **Restart everything**:
   - Stop frontend and backend
   - Clear localStorage and browser cache
   - Delete `Backend/Backend/app.db`
   - Run backend (let it reseed)
   - Run frontend
   - Test login

## Still Having Issues?

Run this in browser console after login to see the exact decoded token:
```javascript
const token = localStorage.getItem('jwt');
const parts = token.split('.');
const payload = JSON.parse(atob(parts[1]));
console.log('Full JWT payload:', payload);
console.log('Role claim:', payload.role);
console.log('Is Admin:', payload.role === 'Admin' || payload.role?.includes('Admin'));
```

Copy the console output when requesting help.
