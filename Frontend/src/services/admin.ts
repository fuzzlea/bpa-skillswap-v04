import { authFetch } from './auth';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5188/api';

export interface User {
    id: string;
    userName: string;
    email: string;
    displayName?: string;
    emailConfirmed: boolean;
    roles: string[];
}

export async function getAllUsers(): Promise<User[]> {
    const res = await authFetch(`${API_BASE}/admin/users`);
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
}

export async function addUser(data: { userName: string; email: string; password: string; displayName?: string }): Promise<any> {
    const res = await authFetch(`${API_BASE}/admin/users`, {
        method: 'POST',
        body: JSON.stringify({
            UserName: data.userName,
            Email: data.email,
            Password: data.password,
            DisplayName: data.displayName
        })
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.join ? error.join(', ') : 'Failed to add user');
    }
    return res.json();
}

export async function deleteUser(id: string): Promise<void> {
    const res = await authFetch(`${API_BASE}/admin/users/${id}`, {
        method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete user');
}

export async function toggleAdminRole(id: string, isAdmin: boolean): Promise<any> {
    const res = await authFetch(`${API_BASE}/admin/users/${id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ IsAdmin: isAdmin })
    });
    if (!res.ok) throw new Error('Failed to toggle admin role');
    return res.json();
}

export async function getSummary(): Promise<any> {
    const res = await authFetch(`${API_BASE}/admin/summary`);
    if (!res.ok) throw new Error('Failed to load admin summary');
    return res.json();
}
