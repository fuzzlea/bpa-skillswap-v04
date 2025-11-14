import { authFetch } from './auth';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5188/api';

export interface Skill {
    id: number;
    name: string;
}

export interface Profile {
    id: number;
    userId: string;
    displayName?: string;
    bio?: string;
    location?: string;
    skillsOffered?: Skill[];
    skillsWanted?: Skill[];
    availability?: string;
    contact?: string;
}

export async function getSkills(): Promise<Skill[]> {
    const res = await fetch(`${API_BASE}/skills`);
    if (!res.ok) throw new Error('Failed to load skills');
    return res.json();
}

export async function getProfiles(): Promise<Profile[]> {
    const res = await fetch(`${API_BASE}/profiles`);
    if (!res.ok) throw new Error('Failed to load profiles');
    return res.json();
}

export async function getProfile(id: number): Promise<Profile> {
    const res = await fetch(`${API_BASE}/profiles/${id}`);
    if (!res.ok) throw new Error('Failed to load profile');
    return res.json();
}

export async function getMyProfile(): Promise<Profile> {
    const res = await authFetch(`${API_BASE}/profiles/me`);
    if (!res.ok) throw new Error('Failed to load my profile');
    return res.json();
}

export async function saveProfile(payload: Partial<Profile>): Promise<Profile> {
    // Transform skill objects to skill IDs for the backend
    const body = {
        displayName: payload.displayName,
        bio: payload.bio,
        location: payload.location,
        contact: payload.contact,
        availability: payload.availability,
        skillsOfferedIds: payload.skillsOffered?.map(s => s.id) || [],
        skillsWantedIds: payload.skillsWanted?.map(s => s.id) || []
    };

    const res = await authFetch(`${API_BASE}/profiles`, {
        method: 'POST',
        body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('Failed to save profile');
    return res.json();
}

export async function updateProfile(id: number, payload: Partial<Profile>): Promise<Profile> {
    // Transform skill objects to skill IDs for the backend
    const body = {
        displayName: payload.displayName,
        bio: payload.bio,
        location: payload.location,
        contact: payload.contact,
        availability: payload.availability,
        skillsOfferedIds: payload.skillsOffered?.map(s => s.id) || [],
        skillsWantedIds: payload.skillsWanted?.map(s => s.id) || []
    };

    const res = await authFetch(`${API_BASE}/profiles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
}

export async function deleteProfile(id: number): Promise<void> {
    const res = await authFetch(`${API_BASE}/profiles/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete profile');
}
