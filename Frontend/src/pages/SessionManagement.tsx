import { useEffect, useState } from 'react';
import { getToken } from '../services/auth';
import { CheckCircle, XCircle, MessageSquare, Trash2, Clock } from 'lucide-react';

interface Attendee {
    id: number;
    requesterProfileId: number;
    attendeeDisplayName: string;
    attendeeEmail?: string;
    hasAttended: boolean;
    verifiedAt?: string;
    createdAt: string;
    attendeeUserId: string;
}

interface SessionData {
    id: number;
    title: string;
    description?: string;
    skill?: { id: number; name: string };
    scheduledAt: string;
    durationMinutes: number;
    attendees: Attendee[];
    totalAttendees: number;
    verifiedAttendees: number;
}

export default function SessionManagement({
    sessionId,
    onNavigate,
}: {
    sessionId: number;
    onNavigate?: (route: string) => void;
}) {
    const isLoggedIn = !!getToken();
    const [session, setSession] = useState<SessionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [confirmKick, setConfirmKick] = useState<number | null>(null);

    if (!isLoggedIn) {
        setTimeout(() => onNavigate?.('login'), 0);
        return <div className="p-6 text-center">Redirecting to login...</div>;
    }

    useEffect(() => {
        loadSessionManagement();
    }, [sessionId]);

    async function loadSessionManagement() {
        try {
            setLoading(true);
            const response = await fetch(`/api/sessions/${sessionId}/management`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            if (!response.ok) throw new Error('Failed to load session');
            const data = await response.json();
            setSession(data);
            setError(null);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }

    async function handleVerifyAttendance(attendeeId: number, isVerified: boolean) {
        try {
            setActionLoading(attendeeId);
            const endpoint = isVerified ? 'unverify' : 'verify';
            const response = await fetch(`/api/sessions/${sessionId}/management/attendees/${attendeeId}/${endpoint}`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            if (!response.ok) throw new Error('Failed to update attendance');
            await loadSessionManagement();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setActionLoading(null);
        }
    }

    async function handleKickAttendee(attendeeId: number) {
        try {
            setActionLoading(attendeeId);
            const response = await fetch(`/api/sessions/${sessionId}/management/attendees/${attendeeId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            if (!response.ok) throw new Error('Failed to remove attendee');
            await loadSessionManagement();
            setConfirmKick(null);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setActionLoading(null);
        }
    }

    async function handleMessageAttendee(_attendeeUserId: string, attendeeName: string) {
        // Navigate to messaging or open message modal
        // For now, we'll just show an alert
        alert(`Message feature for ${attendeeName} - Coming soon!`);
    }

    if (loading) {
        return <div className="p-6 text-center">Loading session management...</div>;
    }

    if (!session) {
        return <div className="p-6 text-center text-red-600">Session not found</div>;
    }

    const sessionDate = new Date(session.scheduledAt);
    const isSessionPast = sessionDate < new Date();

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-md p-6 animate-fade-in-down">
                <h1 className="text-3xl font-bold mb-2 animate-fade-in-up">{session.title}</h1>
                {session.description && (
                    <p className="text-gray-600 mb-4 animate-fade-in-up">{session.description}</p>
                )}
                <div className="flex flex-wrap gap-4 text-sm text-gray-500 animate-fade-in-up">
                    <div className="flex items-center gap-1">
                        <Clock size={16} />
                        {sessionDate.toLocaleString()}
                    </div>
                    <div>Duration: {session.durationMinutes} minutes</div>
                    {session.skill && <div>Skill: {session.skill.name}</div>}
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg animate-fade-in">
                    {error}
                </div>
            )}

            {/* Attendance Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: 'Total Attendees', value: session.totalAttendees, color: 'text-blue-600' },
                    { label: 'Verified Attendance', value: `${session.verifiedAttendees}/${session.totalAttendees}`, color: 'text-green-600' },
                    { label: 'Session Status', value: isSessionPast ? 'Completed' : 'Upcoming', color: isSessionPast ? 'text-blue-600' : 'text-yellow-600' }
                ].map((item, index) => (
                    <div key={index} className={`bg-white rounded-lg shadow p-4 animate-scale-in`}>
                        <div className="text-gray-600 text-sm">{item.label}</div>
                        <div className={`text-3xl font-bold ${item.color}`}>{item.value}</div>
                    </div>
                ))}
            </div>

            {/* Attendees List */}
            <div className="bg-white rounded-lg shadow-md p-6 animate-fade-in-up">
                <h2 className="text-2xl font-bold mb-4 animate-fade-in-down">Attendees</h2>

                {session.attendees.length === 0 ? (
                    <p className="text-gray-600">No accepted attendees yet</p>
                ) : (
                    <div className="space-y-3">
                        {session.attendees.map((attendee) => (
                            <div
                                key={attendee.id}
                                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition animate-fade-in-up"
                            >
                                <div className="flex-1">
                                    <div className="font-semibold">{attendee.attendeeDisplayName}</div>
                                    {attendee.attendeeEmail && (
                                        <div className="text-sm text-gray-500">{attendee.attendeeEmail}</div>
                                    )}
                                    <div className="text-xs text-gray-400 mt-1">
                                        Joined: {new Date(attendee.createdAt).toLocaleDateString()}
                                    </div>
                                </div>

                                {/* Attendance Status */}
                                <div className="flex items-center gap-2 mr-4">
                                    {attendee.hasAttended ? (
                                        <div className="flex items-center gap-1 text-green-600">
                                            <CheckCircle size={20} />
                                            <span className="text-sm">Attended</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1 text-yellow-600">
                                            <XCircle size={20} />
                                            <span className="text-sm">Not Verified</span>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2">
                                    {/* Verify Attendance Button */}
                                    <button
                                        onClick={() => handleVerifyAttendance(attendee.id, attendee.hasAttended)}
                                        disabled={actionLoading === attendee.id}
                                        className={`px-3 py-2 rounded text-sm font-medium transition ${attendee.hasAttended
                                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            : 'bg-green-600 text-white hover:bg-green-700'
                                            } disabled:opacity-50`}
                                    >
                                        {actionLoading === attendee.id ? '...' : attendee.hasAttended ? 'Unverify' : 'Verify'}
                                    </button>

                                    {/* Message Button */}
                                    <button
                                        onClick={() => handleMessageAttendee(attendee.attendeeUserId, attendee.attendeeDisplayName)}
                                        className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                                        title="Send message"
                                    >
                                        <MessageSquare size={18} />
                                    </button>

                                    {/* Kick Button with Confirmation */}
                                    {confirmKick === attendee.id ? (
                                        <div className="flex gap-2 animate-scale-in">
                                            <button
                                                onClick={() => handleKickAttendee(attendee.id)}
                                                disabled={actionLoading === attendee.id}
                                                className="px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition disabled:opacity-50"
                                            >
                                                Confirm
                                            </button>
                                            <button
                                                onClick={() => setConfirmKick(null)}
                                                className="px-3 py-2 bg-gray-400 text-white rounded text-sm hover:bg-gray-500 transition"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setConfirmKick(attendee.id)}
                                            className="p-2 bg-red-600 text-white rounded hover:bg-red-700 transition hover:scale-110"
                                            title="Remove attendee"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
