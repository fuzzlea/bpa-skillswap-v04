import { useEffect, useState } from 'react';
import { authFetch, getCurrentUser } from '../services/auth';
import { Star, X } from 'lucide-react';

interface Participation {
    requestId: number;
    sessionId: number;
    sessionTitle: string;
    sessionDescription: string;
    hostProfileId: number;
    hostDisplayName: string;
    skill: { id: number; name: string } | null;
    scheduledAt: string;
    durationMinutes: number;
    status: string;
}

export default function MyParticipations({
    onViewSession,
    onViewProfile
}: {
    onViewSession?: (sessionId: number) => void;
    onViewProfile?: (profileId: number) => void;
}) {
    const [participations, setParticipations] = useState<Participation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [ratingModal, setRatingModal] = useState<{
        type: 'session' | 'host';
        sessionId?: number;
        hostProfileId?: number;
        hostName?: string;
    } | null>(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submittingRating, setSubmittingRating] = useState(false);

    const currentUser = getCurrentUser();

    useEffect(() => {
        load();
    }, []);

    async function load() {
        try {
            setLoading(true);
            const response = await authFetch('/api/sessions/my-participations');
            if (!response.ok) throw new Error('Failed to load participations');
            const data = await response.json();
            setParticipations(data);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setLoading(false);
        }
    }

    async function submitRating() {
        if (!ratingModal || !currentUser?.profileId) return;

        try {
            setSubmittingRating(true);

            if (ratingModal.type === 'session') {
                // Rate the session
                const response = await authFetch('/api/ratings', {
                    method: 'POST',
                    body: JSON.stringify({
                        sessionId: ratingModal.sessionId,
                        targetProfileId: ratingModal.hostProfileId,
                        score: rating,
                        comment: comment || undefined
                    })
                });

                if (!response.ok) throw new Error('Failed to submit rating');
            } else if (ratingModal.type === 'host') {
                // Rate the host (user profile) - no session required
                const response = await authFetch('/api/ratings', {
                    method: 'POST',
                    body: JSON.stringify({
                        targetProfileId: ratingModal.hostProfileId,
                        score: rating,
                        comment: comment || undefined
                    })
                });

                if (!response.ok) throw new Error('Failed to submit rating');
            }

            alert('Rating submitted successfully!');
            setRatingModal(null);
            setRating(5);
            setComment('');
        } catch (e) {
            alert((e as Error).message);
        } finally {
            setSubmittingRating(false);
        }
    }

    const renderStars = (count: number, onHover?: (value: number) => void) => {
        return Array(5).fill(0).map((_, i) => (
            <button
                key={i}
                type="button"
                onMouseEnter={() => onHover?.(i + 1)}
                onClick={() => setRating(i + 1)}
                className="focus:outline-none transition"
            >
                <Star
                    size={28}
                    className={i < count ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                />
            </button>
        ));
    };

    if (loading) {
        return <div className="p-6 text-center">Loading your participations...</div>;
    }

    if (error) {
        return <div className="p-6 text-red-600">Error: {error}</div>;
    }

    const acceptedParticipations = participations.filter(p => p.status === 'Accepted');
    const pendingParticipations = participations.filter(p => p.status === 'Pending');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">My Participations</h1>
                <p className="text-gray-600 mt-2">Sessions you're joining or have joined</p>
            </div>

            {/* Accepted Sessions */}
            {acceptedParticipations.length > 0 && (
                <div>
                    <h2 className="text-xl font-semibold mb-4 text-green-700">Accepted Sessions ({acceptedParticipations.length})</h2>
                    <div className="space-y-4">
                        {acceptedParticipations.map(participation => (
                            <div
                                key={participation.requestId}
                                className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition cursor-pointer bg-white"
                                onClick={() => onViewSession?.(participation.sessionId)}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold">{participation.sessionTitle}</h3>
                                        {participation.skill && (
                                            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full mt-2">
                                                {participation.skill.name}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-right text-sm text-gray-600 ml-4">
                                        <div>📅 {participation.scheduledAt?.substring(0, 10)}</div>
                                        <div>⏱️ {participation.durationMinutes} min</div>
                                    </div>
                                </div>

                                {participation.sessionDescription && (
                                    <p className="text-gray-700 mb-4 line-clamp-2">{participation.sessionDescription}</p>
                                )}

                                {/* Host Info */}
                                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onViewProfile?.(participation.hostProfileId);
                                        }}
                                        className="text-blue-600 hover:underline font-medium"
                                    >
                                        Host: {participation.hostDisplayName}
                                    </button>

                                    {/* Rating Buttons */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setRatingModal({
                                                    type: 'session',
                                                    sessionId: participation.sessionId,
                                                    hostProfileId: participation.hostProfileId
                                                });
                                                setRating(5);
                                                setComment('');
                                            }}
                                            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition text-sm"
                                        >
                                            ⭐ Rate Session
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setRatingModal({
                                                    type: 'host',
                                                    hostProfileId: participation.hostProfileId,
                                                    hostName: participation.hostDisplayName
                                                });
                                                setRating(5);
                                                setComment('');
                                            }}
                                            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition text-sm"
                                        >
                                            ⭐ Rate Host
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Pending Sessions */}
            {pendingParticipations.length > 0 && (
                <div>
                    <h2 className="text-xl font-semibold mb-4 text-yellow-700">Pending Sessions ({pendingParticipations.length})</h2>
                    <div className="space-y-4">
                        {pendingParticipations.map(participation => (
                            <div
                                key={participation.requestId}
                                className="border border-yellow-200 rounded-lg p-6 hover:shadow-lg transition cursor-pointer bg-yellow-50"
                                onClick={() => onViewSession?.(participation.sessionId)}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold">{participation.sessionTitle}</h3>
                                        {participation.skill && (
                                            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full mt-2">
                                                {participation.skill.name}
                                            </span>
                                        )}
                                        <p className="text-sm text-yellow-700 mt-2 font-semibold">Waiting for host approval...</p>
                                    </div>
                                    <div className="text-right text-sm text-gray-600 ml-4">
                                        <div>📅 {participation.scheduledAt?.substring(0, 10)}</div>
                                        <div>⏱️ {participation.durationMinutes} min</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {acceptedParticipations.length === 0 && pendingParticipations.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 font-semibold">No participations yet</p>
                    <p className="text-gray-500 mt-2">Browse sessions and request to join!</p>
                </div>
            )}

            {/* Rating Modal */}
            {ratingModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">
                                {ratingModal.type === 'session' ? 'Rate Session' : `Rate ${ratingModal.hostName}`}
                            </h3>
                            <button
                                onClick={() => setRatingModal(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="mb-6">
                            <p className="text-gray-600 mb-4">How would you rate this {ratingModal.type === 'session' ? 'session' : 'host'}?</p>
                            <div className="flex justify-center gap-2">
                                {renderStars(rating)}
                            </div>
                            <p className="text-center text-sm text-gray-600 mt-3">{rating} out of 5 stars</p>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Comments (optional)
                            </label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Share your experience..."
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                rows={4}
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setRatingModal(null)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitRating}
                                disabled={submittingRating}
                                className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:bg-gray-400 transition"
                            >
                                {submittingRating ? 'Submitting...' : 'Submit Rating'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
