import { useEffect, useState } from 'react';
import { getProfile } from '../services/profile';
import { getAverageRating } from '../services/ratings';
import { getCurrentUser } from '../services/auth';
import { Star } from 'lucide-react';

interface ProfileData {
    id: number;
    displayName: string;
    bio: string;
    location: string;
    contact: string;
    availability: string;
    skillsOffered: Array<{ id: number; name: string }>;
    skillsWanted: Array<{ id: number; name: string }>;
}

interface ActiveSession {
    id: number;
    title: string;
    description: string;
    skill: { id: number; name: string } | null;
    scheduledAt: string;
    durationMinutes: number;
    isOpen: boolean;
}

interface ProfileViewProps {
    profileId: number;
    onNavigate?: (route: string, state?: any) => void;
    onEditProfile?: () => void;
}

export default function ProfileView({ profileId, onNavigate, onEditProfile }: ProfileViewProps) {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [sessions, setSessions] = useState<ActiveSession[]>([]);
    const [averageRating, setAverageRating] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isOwnProfile, setIsOwnProfile] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                const currentUser = getCurrentUser();

                // Get profile
                const profileData = await getProfile(profileId);
                setProfile(profileData);

                // Check if this is the user's own profile
                if (currentUser?.profileId === profileId) {
                    setIsOwnProfile(true);
                }

                // Get average rating
                try {
                    const avgRating = await getAverageRating(profileId);
                    setAverageRating(avgRating);
                } catch {
                    // Rating might not exist yet
                }

                // Get active sessions
                try {
                    const response = await fetch(`/api/sessions/profile/${profileId}/active`);
                    if (response.ok) {
                        const data = await response.json();
                        // Handle both camelCase and PascalCase property names from backend
                        const normalizedSessions = data.map((session: any) => ({
                            id: session.id || session.Id,
                            title: session.title || session.Title,
                            description: session.description || session.Description,
                            skill: session.skill || session.Skill,
                            scheduledAt: session.scheduledAt || session.ScheduledAt,
                            durationMinutes: session.durationMinutes || session.DurationMinutes,
                            isOpen: session.isOpen !== undefined ? session.isOpen : session.IsOpen
                        }));
                        setSessions(normalizedSessions);
                    }
                } catch (e) {
                    console.error('Failed to load sessions:', e);
                }
            } catch (e) {
                setError((e as Error).message);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [profileId]);

    if (loading) return <div className="p-6">Loading profile...</div>;
    if (error) return <div className="p-6 text-red-600">{error}</div>;
    if (!profile) return <div className="p-6">Profile not found</div>;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const renderStars = (rating: number) => {
        return Array(5).fill(0).map((_, i) => (
            <Star
                key={i}
                size={16}
                className={i < Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
            />
        ));
    };

    return (
        <div className="space-y-6">
            {/* Profile Header Card */}
            <div className="p-6 bg-white rounded shadow">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h1 className="text-2xl font-bold">{profile.displayName}</h1>
                        {profile.location && <p className="text-gray-600 mt-1">📍 {profile.location}</p>}
                    </div>
                    {isOwnProfile && (
                        <button
                            onClick={onEditProfile}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Edit Profile
                        </button>
                    )}
                </div>

                {/* Rating */}
                <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="flex gap-1">
                            {renderStars(averageRating || 0)}
                        </div>
                        <span className="text-sm text-gray-600">
                            {averageRating ? averageRating.toFixed(2) : 'No ratings yet'}
                        </span>
                    </div>
                </div>

                {/* Bio */}
                {profile.bio && (
                    <div className="mb-4">
                        <p className="text-gray-700">{profile.bio}</p>
                    </div>
                )}

                {/* Contact & Availability */}
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    {profile.contact && (
                        <div>
                            <strong className="text-gray-700">Contact:</strong>
                            <p className="text-gray-600">{profile.contact}</p>
                        </div>
                    )}
                    {profile.availability && (
                        <div>
                            <strong className="text-gray-700">Availability:</strong>
                            <p className="text-gray-600">{profile.availability}</p>
                        </div>
                    )}
                </div>

                {/* Skills */}
                <div className="border-t pt-4">
                    <div className="mb-3">
                        <strong className="text-gray-700">Skills Offered:</strong>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {profile.skillsOffered && profile.skillsOffered.length > 0 ? (
                                profile.skillsOffered.map(skill => (
                                    <span
                                        key={skill.id}
                                        className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                                    >
                                        {skill.name}
                                    </span>
                                ))
                            ) : (
                                <span className="text-gray-500 text-sm">No skills listed</span>
                            )}
                        </div>
                    </div>

                    <div>
                        <strong className="text-gray-700">Skills Wanted:</strong>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {profile.skillsWanted && profile.skillsWanted.length > 0 ? (
                                profile.skillsWanted.map(skill => (
                                    <span
                                        key={skill.id}
                                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                                    >
                                        {skill.name}
                                    </span>
                                ))
                            ) : (
                                <span className="text-gray-500 text-sm">No skills listed</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Active Sessions */}
            <div className="p-6 bg-white rounded shadow">
                <h2 className="text-xl font-bold mb-4">Active Sessions</h2>
                {sessions.length > 0 ? (
                    <div className="space-y-4">
                        {sessions.map(session => (
                            <div
                                key={session.id}
                                className="border rounded p-4 hover:bg-gray-50 cursor-pointer transition"
                                onClick={() => onNavigate && onNavigate('sessiondetail', { sessionId: session.id })}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold text-lg">{session.title}</h3>
                                        {session.skill && (
                                            <p className="text-sm text-blue-600 font-semibold">{session.skill.name}</p>
                                        )}
                                    </div>
                                    <div className="text-right text-sm text-gray-600">
                                        <p>{session.durationMinutes} min</p>
                                    </div>
                                </div>
                                <p className="text-gray-700 mb-2">{session.description}</p>
                                <div className="text-sm text-gray-600">
                                    📅 {formatDate(session.scheduledAt)}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">No active sessions</p>
                )}
            </div>
        </div>
    );
}
