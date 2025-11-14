import { useEffect, useState } from 'react';
import { getSession, respondToRequest } from '../services/sessions';
import { getCurrentUser } from '../services/auth';

export default function SessionDetail({
    sessionId,
    onBack,
    onProfile
}: {
    sessionId: number;
    onBack: () => void;
    onProfile?: (profileId: number) => void;
}) {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [respondingRequestId, setRespondingRequestId] = useState<number | null>(null);
    const [responseMessage, setResponseMessage] = useState('');
    const [respondingType, setRespondingType] = useState<'accept' | 'reject' | null>(null);

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
        setRespondingRequestId(requestId);
        setRespondingType(accept ? 'accept' : 'reject');
        setResponseMessage('');
    }

    async function submitResponse() {
        if (respondingRequestId === null || respondingType === null) return;

        try {
            const accept = respondingType === 'accept';
            await respondToRequest(respondingRequestId, accept, responseMessage || undefined);
            setRespondingRequestId(null);
            setResponseMessage('');
            setRespondingType(null);
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
            <p className="text-sm text-gray-600">
                Hosted by{' '}
                <button
                    className="text-blue-600 hover:underline"
                    onClick={() => onProfile?.(session.hostProfileId)}
                >
                    {session.hostDisplayName || 'Unknown'}
                </button>
            </p>
            <p className="text-sm text-gray-600">{session.scheduledAt} • {session.durationMinutes} min</p>
            <p className="mt-4">{session.description}</p>

            <div className="mt-6">
                <h3 className="font-semibold">Requests</h3>
                {session.requests?.length === 0 && <div className="text-sm text-gray-600">No requests yet.</div>}
                <div className="space-y-2 mt-2">
                    {session.requests?.map((r: any) => (
                        <div key={r.id} className="border p-3 rounded flex justify-between items-start gap-4">
                            <div className="flex-1">
                                <button
                                    className="font-medium text-blue-600 hover:underline text-left"
                                    onClick={() => onProfile?.(r.requesterProfileId)}
                                >
                                    {r.requesterDisplayName ?? 'Unknown'}
                                </button>
                                <div className="text-sm text-gray-600">{r.message}</div>
                                <div className="text-xs text-gray-500">{r.status} • {new Date(r.createdAt).toLocaleString()}</div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                {isHost && r.status === 'Pending' && (
                                    <>
                                        <button
                                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                            onClick={() => handleRespond(r.id, true)}
                                        >
                                            Accept
                                        </button>
                                        <button
                                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                                            onClick={() => handleRespond(r.id, false)}
                                        >
                                            Reject
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Response Modal */}
            {respondingRequestId !== null && respondingType !== null && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6">
                        <h3 className="text-lg font-bold mb-4">
                            {respondingType === 'accept' ? 'Accept Request' : 'Reject Request'}
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            {respondingType === 'accept'
                                ? 'Add an optional message to the requester'
                                : 'Add an optional message explaining the rejection'}
                        </p>
                        <textarea
                            className="w-full border border-gray-300 rounded p-3 mb-4 text-sm"
                            rows={4}
                            placeholder="Optional message..."
                            value={responseMessage}
                            onChange={(e) => setResponseMessage(e.target.value)}
                        />
                        <div className="flex gap-3 justify-end">
                            <button
                                className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
                                onClick={() => {
                                    setRespondingRequestId(null);
                                    setResponseMessage('');
                                    setRespondingType(null);
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className={`px-4 py-2 text-white rounded ${respondingType === 'accept'
                                    ? 'bg-green-600 hover:bg-green-700'
                                    : 'bg-red-600 hover:bg-red-700'
                                    }`}
                                onClick={submitResponse}
                            >
                                {respondingType === 'accept' ? 'Accept' : 'Reject'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
