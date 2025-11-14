import { useEffect, useState } from 'react';
import { listSessions } from '../services/sessions';
import { getProfiles } from '../services/profile';
import { getCurrentUser } from '../services/auth';
import { Users, BookOpen, Calendar, ArrowRight, Sparkles } from 'lucide-react';

export default function Dashboard({
    onNavigate,
    onViewSession,
    onViewProfile
}: {
    onNavigate: (route: string, state?: any) => void;
    onViewSession?: (sessionId: number) => void;
    onViewProfile?: (profileId: number) => void;
}) {
    const [sessions, setSessions] = useState<any[]>([]);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState<any>(null);

    useEffect(() => {
        load();
    }, []);

    async function load() {
        try {
            setLoading(true);
            const [sessionsData, profilesData] = await Promise.all([
                listSessions(),
                getProfiles()
            ]);
            setSessions(sessionsData);
            setProfiles(profilesData);

            // Get current user's profile
            const currentUser = getCurrentUser();
            if (currentUser?.profileId) {
                const myProfile = profilesData.find(p => p.id === currentUser.profileId);
                setUserProfile(myProfile);
            }
        } catch (e) {
            console.error('Failed to load dashboard data:', e);
        } finally {
            setLoading(false);
        }
    }

    // Get featured sessions (open sessions)
    const featuredSessions = sessions.filter(s => s.isOpen).slice(0, 6);

    // Get active hosts (people with open sessions)
    const activeHosts = Array.from(
        new Map(
            sessions
                .filter(s => s.isOpen)
                .map(s => ({
                    profileId: s.hostProfileId,
                    displayName: s.hostDisplayName
                }))
                .map(host => [host.profileId, host])
        ).values()
    );

    const stats = [
        {
            icon: <Users className="w-8 h-8 text-blue-600" />,
            label: 'Active Members',
            value: profiles.length,
            color: 'bg-blue-50'
        },
        {
            icon: <Calendar className="w-8 h-8 text-green-600" />,
            label: 'Open Sessions',
            value: sessions.filter(s => s.isOpen).length,
            color: 'bg-green-50'
        },
        {
            icon: <BookOpen className="w-8 h-8 text-purple-600" />,
            label: 'Total Sessions',
            value: sessions.length,
            color: 'bg-purple-50'
        }
    ];

    if (loading) {
        return <div className="p-6 text-center">Loading dashboard...</div>;
    }

    return (
        <div className="space-y-8">
            {/* Hero Section */}
            <div className="bg-linear-to-r from-blue-600 to-blue-800 text-white rounded-lg p-8 md:p-12">
                <div className="max-w-2xl">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles size={24} />
                        <span className="text-sm font-semibold opacity-90">Welcome back!</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        {userProfile ? `Learn & Share with ${userProfile.displayName}` : 'Master New Skills, Share Your Expertise'}
                    </h1>
                    <p className="text-lg opacity-90 mb-6">
                        Connect with experts in your community. Take sessions to learn new skills or host your own.
                    </p>
                    <div className="flex gap-4 flex-wrap">
                        <button
                            onClick={() => onNavigate('sessions')}
                            className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition flex items-center gap-2"
                        >
                            Browse Sessions <ArrowRight size={20} />
                        </button>
                        <button
                            onClick={() => onNavigate('mysessions')}
                            className="px-6 py-3 bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-900 transition flex items-center gap-2 border border-blue-500"
                        >
                            My Sessions <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className={`${stat.color} rounded-lg p-6`}>
                        <div className="flex items-center gap-4">
                            <div>{stat.icon}</div>
                            <div>
                                <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Featured Sessions */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold">Featured Sessions</h2>
                        <p className="text-gray-600 mt-1">Open sessions waiting for learners like you</p>
                    </div>
                    <button
                        onClick={() => onNavigate('sessions')}
                        className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 transition"
                    >
                        View All <ArrowRight size={16} />
                    </button>
                </div>

                {featuredSessions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {featuredSessions.map(session => (
                            <div
                                key={session.id}
                                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer"
                                onClick={() => onViewSession?.(session.id)}
                            >
                                {/* Card Header with Skill Tag */}
                                <div className="bg-linear-to-r from-gray-50 to-gray-100 p-4">
                                    {session.skill && (
                                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                                            {session.skill.name}
                                        </span>
                                    )}
                                </div>

                                {/* Card Content */}
                                <div className="p-4">
                                    <h3 className="font-bold text-lg line-clamp-2">{session.title}</h3>
                                    <p className="text-gray-600 text-sm mt-2 line-clamp-2">{session.description}</p>

                                    {/* Host Info */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onViewProfile?.(session.hostProfileId);
                                        }}
                                        className="mt-4 text-sm text-blue-600 hover:underline font-medium"
                                    >
                                        By {session.hostDisplayName || 'Unknown'}
                                    </button>

                                    {/* Session Details */}
                                    <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600 space-y-2">
                                        <div className="flex justify-between">
                                            <span>⏱️ Duration:</span>
                                            <span className="font-semibold">{session.durationMinutes} min</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>📅 Scheduled:</span>
                                            <span className="font-semibold">{session.scheduledAt?.substring(0, 10)}</span>
                                        </div>
                                    </div>

                                    {/* Status Badge */}
                                    <div className="mt-4">
                                        <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                                            ✓ Open for Requests
                                        </span>
                                    </div>
                                </div>

                                {/* View Button */}
                                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onViewSession?.(session.id);
                                        }}
                                        className="w-full py-2 text-blue-600 font-semibold hover:bg-blue-50 rounded transition"
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600 font-semibold">No open sessions yet</p>
                        <p className="text-gray-500 mt-2">Check back soon or create your own session!</p>
                    </div>
                )}
            </div>

            {/* Top Instructors / Active Hosts */}
            {activeHosts.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold">Active Hosts</h2>
                            <p className="text-gray-600 mt-1">Community members currently offering sessions</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {activeHosts.slice(0, 8).map((host, index) => (
                            <button
                                key={index}
                                onClick={() => onViewProfile?.(host.profileId)}
                                className="p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-blue-300 transition text-center group"
                            >
                                <div className="w-16 h-16 bg-linear-to-br from-blue-400 to-blue-600 rounded-full mx-auto mb-3 flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition">
                                    {host.displayName?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <p className="font-semibold text-sm line-clamp-2 text-gray-900">
                                    {host.displayName || 'Unknown'}
                                </p>
                                <p className="text-xs text-blue-600 mt-2 font-medium">View Profile</p>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* CTA Section */}
            <div className="bg-linear-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-8 md:p-12">
                <div className="max-w-2xl">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        Ready to Share Your Skills?
                    </h2>
                    <p className="text-gray-700 mb-6 text-lg">
                        Host your own session and help others learn what you know. It's free, easy, and rewarding.
                    </p>
                    <button
                        onClick={() => onNavigate('mysessions')}
                        className="px-8 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
                    >
                        Create Your First Session <Sparkles size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
