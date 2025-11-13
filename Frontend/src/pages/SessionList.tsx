import { useEffect, useState } from 'react';
import { listSessions, requestJoin } from '../services/sessions';

export default function SessionsList({ onView }: { onView?: (id: number) => void }) {
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => { load(); }, []);

    async function load() {
        try {
            setLoading(true);
            const s = await listSessions();
            setSessions(s);
        } catch (e) {
            setError((e as Error).message);
        } finally { setLoading(false); }
    }

    async function handleRequest(sessionId: number) {
        try {
            await requestJoin(sessionId, 'Hi — I would like to join');
            alert('Request sent');
        } catch (e) {
            alert((e as Error).message);
        }
    }

    return (
        <div className="p-6 bg-white rounded shadow">
            <h2 className="text-xl font-bold mb-4">Sessions</h2>
            {loading && <div>Loading sessions...</div>}
            {error && <div className="text-red-600">{error}</div>}
            <div className="space-y-3">
                {sessions.map(s => (
                    <div key={s.id} className="border p-3 rounded">
                        <div className="flex justify-between items-center">
                            <div>
                                <div className="font-semibold">{s.title}</div>
                                <div className="text-sm text-gray-600">Host: {s.hostDisplayName || '—'}</div>
                                <div className="text-sm text-gray-600">{s.scheduledAt} • {s.durationMinutes} min</div>
                            </div>
                            <div className="flex gap-2">
                                <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => handleRequest(s.id)}>Request to Join</button>
                                <button className="px-3 py-1 bg-gray-200 rounded" onClick={() => onView?.(s.id)}>View</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
