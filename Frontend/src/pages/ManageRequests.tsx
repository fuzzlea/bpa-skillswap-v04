import { useEffect, useState } from 'react';
import { authFetch } from '../services/auth';
import { respondToRequest } from '../services/sessions';
import { CheckCircle, XCircle, MessageSquare } from 'lucide-react';

interface Request {
    id: number;
    sessionId: number;
    sessionTitle: string;
    requesterDisplayName: string;
    requesterProfileId: number;
    message: string;
    status: string;
    createdAt: string;
}

export default function ManageRequests() {
    const [requests, setRequests] = useState<Request[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [respondingRequestId, setRespondingRequestId] = useState<number | null>(null);
    const [responseMessage, setResponseMessage] = useState('');
    const [respondingType, setRespondingType] = useState<'accept' | 'reject' | null>(null);

    useEffect(() => {
        loadRequests();
    }, []);

    async function loadRequests() {
        try {
            setLoading(true);
            const response = await authFetch('/api/sessions/requests/pending');
            if (!response.ok) throw new Error('Failed to load requests');
            const data = await response.json();
            setRequests(data);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setLoading(false);
        }
    }

    function handleRespond(requestId: number, accept: boolean) {
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
            await loadRequests();
        } catch (e) {
            alert((e as Error).message);
        }
    }

    if (loading) return <div className="p-6 text-center">Loading requests...</div>;
    if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

    const pendingRequests = requests.filter(r => r.status === 'Pending');
    const otherRequests = requests.filter(r => r.status !== 'Pending');

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Manage Join Requests</h1>

            {pendingRequests.length === 0 && otherRequests.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                    <p className="text-gray-600">No join requests yet</p>
                </div>
            ) : (
                <>
                    {/* Pending Requests */}
                    {pendingRequests.length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-xl font-semibold mb-4 text-blue-900">
                                Pending Requests ({pendingRequests.length})
                            </h2>
                            <div className="space-y-3">
                                {pendingRequests.map((req) => (
                                    <div
                                        key={req.id}
                                        className="bg-white border-l-4 border-l-blue-500 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-900">
                                                    {req.requesterDisplayName}
                                                </div>
                                                <div className="text-sm text-blue-600 font-medium mt-1">
                                                    Requested to join: <span className="text-gray-900">{req.sessionTitle}</span>
                                                </div>
                                                {req.message && (
                                                    <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700 flex gap-2">
                                                        <MessageSquare className="w-4 h-4 shrink-0 mt-0.5 text-gray-500" />
                                                        <span>{req.message}</span>
                                                    </div>
                                                )}
                                                <div className="text-xs text-gray-500 mt-2">
                                                    {new Date(req.createdAt).toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="flex gap-2 shrink-0">
                                                <button
                                                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium text-sm flex items-center gap-2"
                                                    onClick={() => handleRespond(req.id, true)}
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    Accept
                                                </button>
                                                <button
                                                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium text-sm flex items-center gap-2"
                                                    onClick={() => handleRespond(req.id, false)}
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Resolved Requests */}
                    {otherRequests.length > 0 && (
                        <div>
                            <h2 className="text-xl font-semibold mb-4 text-gray-600">
                                Resolved Requests ({otherRequests.length})
                            </h2>
                            <div className="space-y-2">
                                {otherRequests.map((req) => (
                                    <div
                                        key={req.id}
                                        className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="font-medium text-gray-900">
                                                    {req.requesterDisplayName}
                                                </div>
                                                <div className="text-sm text-gray-600 mt-1">
                                                    {req.sessionTitle}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-2">
                                                    {new Date(req.createdAt).toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="shrink-0">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                        req.status === 'Accepted'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}
                                                >
                                                    {req.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

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
                            className="w-full border border-gray-300 rounded p-3 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={4}
                            placeholder="Optional message..."
                            value={responseMessage}
                            onChange={(e) => setResponseMessage(e.target.value)}
                        />
                        <div className="flex gap-3 justify-end">
                            <button
                                className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50 font-medium"
                                onClick={() => {
                                    setRespondingRequestId(null);
                                    setResponseMessage('');
                                    setRespondingType(null);
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className={`px-4 py-2 text-white rounded font-medium ${
                                    respondingType === 'accept'
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
