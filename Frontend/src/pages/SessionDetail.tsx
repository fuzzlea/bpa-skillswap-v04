import { useEffect, useState } from 'react';
import { getSession, respondToRequest } from '../services/sessions';
import { getCurrentUser } from '../services/auth';

export default function SessionDetail({ sessionId, onBack }: { sessionId: number; onBack: () => void }) {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => { load(); }, [sessionId]);

    async function load() {
        try {
            setLoading(true);
            const s = await getSession(sessionId);
            setSession(s);
        } catch (e) {
            setError((e as Error).message);
        } finally { setLoading(false); }
    }

    async function handleRespond(requestId: number, accept: boolean) {
        try {
            await respondToRequest(requestId, accept);
            await load();
        } catch (e) {
            alert((e as Error).message);
        }
    }

    if (loading) return <div className="p-6">Loading session...</div>;
    if (error) return <div className="p-6 text-red-600">{error}</div>;
    if (!session) return <div className="p-6">Session not found</div>;

    const currentUser = getCurrentUser();
    const isHost = currentUser && session.hostProfileId === currentUser.id;

    return (
        <div className="p-6 bg-white rounded shadow">
            <button className="mb-4 text-sm text-blue-600" onClick={onBack}>← Back to sessions</button>
            <h2 className="text-xl font-bold">{session.title}</h2>
            <p className="text-sm text-gray-600">{session.scheduledAt} • {session.durationMinutes} min</p>
            <p className="mt-4">{session.description}</p>

            <div className="mt-6">
                <h3 className="font-semibold">Requests</h3>
                {session.requests?.length === 0 && <div className="text-sm text-gray-600">No requests yet.</div>}
                <div className="space-y-2 mt-2">
                    {session.requests?.map((r: any) => (
                        <div key={r.id} className="border p-2 rounded flex justify-between items-center">
                            <div>
                                <div className="font-medium">{r.requesterDisplayName ?? 'Unknown'}</div>
                                <div className="text-sm text-gray-600">{r.message}</div>
                                <div className="text-xs text-gray-500">{r.status} • {new Date(r.createdAt).toLocaleString()}</div>
                            </div>
                            <div className="flex gap-2">
                                {isHost && r.status === 'Pending' && (
                                    <>
                                        <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={() => handleRespond(r.id, true)}>Accept</button>
                                        <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={() => handleRespond(r.id, false)}>Reject</button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
