import { authFetch } from './auth';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5188/api';

export interface RatingDto {
    id: number;
    sessionId: number;
    raterProfileId: number;
    targetProfileId: number;
    score: number;
    comment?: string;
    createdAt: string;
}

export async function submitRating(payload: {
    sessionId: number;
    targetProfileId: number;
    score: number; // 1-5
    comment?: string;
}) {
    const res = await authFetch(`${API_BASE}/ratings`, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to submit rating');
    return res.json();
}

export async function getRatingsForProfile(profileId: number): Promise<RatingDto[]> {
    const res = await fetch(`${API_BASE}/ratings/profile/${profileId}`);
    if (!res.ok) throw new Error('Failed to load ratings');
    return res.json();
}

export async function getAverageRating(profileId: number): Promise<number> {
    const res = await fetch(`${API_BASE}/ratings/profile/${profileId}/average`);
    if (!res.ok) throw new Error('Failed to load average rating');
    const json = await res.json();
    return json.average ?? 0;
}
