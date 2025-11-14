const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5188/api';

export interface DecodedToken {
    sub: string;
    unique_name: string;
    nameid: string;
    aud: string;
    exp: number;
    iss: string;
    role?: string | string[];
}

export async function register(data: { userName: string; email: string; password: string; displayName?: string }) {
    const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ UserName: data.userName, Email: data.email, Password: data.password, DisplayName: data.displayName })
    });
    return res;
}

export async function login(data: { userName: string; password: string }) {
    const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ UserName: data.userName, Password: data.password })
    });
    if (!res.ok) throw new Error('Invalid credentials');
    const json = await res.json();
    const token = json.token;
    localStorage.setItem('jwt', token);

    // Debug: log the response and decoded token
    console.log('Login response:', { roles: json.roles, userName: json.userName });
    const decoded = decodeToken(token);
    console.log('Decoded JWT:', decoded);

    return token;
}

export function logout() {
    localStorage.removeItem('jwt');
}

export function getToken() {
    return localStorage.getItem('jwt');
}

export function decodeToken(token: string): DecodedToken | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const decoded = JSON.parse(atob(parts[1]));
        return decoded;
    } catch {
        return null;
    }
}

export function getCurrentUser(): { id: string; userName: string; profileId?: number; roles: string[] } | null {
    const token = getToken();
    if (!token) return null;

    const decoded = decodeToken(token) as any;
    if (!decoded) return null;

    // Extract roles from the JWT
    // Roles can come from:
    // 1. Simple 'role' property (if single role as string)
    // 2. Simple 'role' property as array (if multiple roles)
    // 3. Microsoft namespace key: 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
    const roles: string[] = [];

    // Check for Microsoft namespace role claim first (standard ASP.NET Core Identity JWT format)
    const msRoleClaim = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    if (msRoleClaim) {
        if (Array.isArray(msRoleClaim)) {
            roles.push(...msRoleClaim);
        } else if (typeof msRoleClaim === 'string') {
            roles.push(msRoleClaim);
        }
    }

    // Fallback to simple 'role' property if no Microsoft namespace claim
    if (roles.length === 0 && decoded.role) {
        if (Array.isArray(decoded.role)) {
            roles.push(...decoded.role);
        } else if (typeof decoded.role === 'string') {
            roles.push(decoded.role);
        }
    }

    const result = {
        id: decoded.nameid || decoded.sub || '',
        userName: decoded.unique_name || '',
        roles
    };

    // Add profileId if it exists in the token
    if (decoded.profileId) {
        (result as any).profileId = parseInt(decoded.profileId, 10);
    }

    return result;
}

export function isAdmin(): boolean {
    const user = getCurrentUser();
    return user?.roles.includes('Admin') ?? false;
}

export async function authFetch(input: RequestInfo, init?: RequestInit) {
    const token = getToken();
    const headers = new Headers(init?.headers as HeadersInit);
    headers.set('Content-Type', 'application/json');
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const res = await fetch(input, { ...init, headers });
    return res;
}
