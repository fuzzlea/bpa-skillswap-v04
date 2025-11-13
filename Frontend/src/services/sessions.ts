import { authFetch } from './auth';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5188/api';

export interface SessionDto {
    id: number;
    title: string;
    description?: string;
    skill?: { id: number; name: string } | null;
    hostProfileId: number;
    hostDisplayName?: string | null;
    scheduledAt: string;
    durationMinutes: number;
    isOpen: boolean;
}

export async function listSessions(): Promise<SessionDto[]> {
    const res = await fetch(`${API_BASE}/sessions`);
    if (!res.ok) throw new Error('Failed to load sessions');
    return res.json();
}

export async function getSession(id: number): Promise<SessionDto> {
    const res = await fetch(`${API_BASE}/sessions/${id}`);
    if (!res.ok) throw new Error('Failed to load session');
    return res.json();
}

export async function createSession(payload: {
    title: string;
    description?: string;
    skillId?: number | null;
    scheduledAt: string; // ISO string
    durationMinutes: number;
}) {
    const res = await authFetch(`${API_BASE}/sessions`, {
        method: 'POST',
        body: JSON.stringify({
            Title: payload.title,
            Description: payload.description,
            SkillId: payload.skillId,
            ScheduledAt: payload.scheduledAt,
            DurationMinutes: payload.durationMinutes
        })
    });
    if (!res.ok) throw new Error('Failed to create session');
    return res.json();
}

export async function requestJoin(sessionId: number, message?: string) {
    const res = await authFetch(`${API_BASE}/sessions/${sessionId}/requests`, {
        method: 'POST',
        body: JSON.stringify({ Message: message })
    });
    if (!res.ok) throw new Error('Failed to request to join session');
    return res.json();
}

export async function respondToRequest(requestId: number, accept: boolean) {
    const res = await authFetch(`${API_BASE}/sessions/requests/${requestId}/respond`, {
        method: 'POST',
        body: JSON.stringify({ Accept: accept })
    });
    if (!res.ok) throw new Error('Failed to respond to request');
    return res.json();
}

export async function listRequestsForHost(): Promise<any[]> {
    // This endpoint doesn't exist yet; placeholder for future implementation
    const res = await authFetch(`${API_BASE}/sessions/requests/host`);
    if (!res.ok) throw new Error('Failed to load requests');
    return res.json();
}
