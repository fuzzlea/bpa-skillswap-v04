import { useEffect, useState } from 'react';
import { listSessions, requestJoin } from '../services/sessions';
import { getToken } from '../services/auth';
import { Search, X } from 'lucide-react';

export default function SessionsList({
    onView,
    onProfile,
    onNavigate
}: {
    onView?: (id: number) => void;
    onProfile?: (profileId: number) => void;
    onNavigate?: (route: string) => void;
}) {
    const [allSessions, setAllSessions] = useState<any[]>([]);
    const [filteredSessions, setFilteredSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
    const [skillFilter, setSkillFilter] = useState<string>('all');
    const isLoggedIn = !!getToken();

    useEffect(() => { load(); }, []);

    useEffect(() => {
        // Apply filters whenever search, statusFilter, or skillFilter changes
        let filtered = allSessions;

        // Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(s =>
                s.title.toLowerCase().includes(term) ||
                s.description?.toLowerCase().includes(term) ||
                s.hostDisplayName?.toLowerCase().includes(term)
            );
        }

        // Status filter
        if (statusFilter === 'open') {
            filtered = filtered.filter(s => s.isOpen);
        } else if (statusFilter === 'closed') {
            filtered = filtered.filter(s => !s.isOpen);
        }

        // Skill filter
        if (skillFilter !== 'all') {
            filtered = filtered.filter(s => s.skill?.id === parseInt(skillFilter));
        }

        setFilteredSessions(filtered);
    }, [searchTerm, statusFilter, skillFilter, allSessions]);

    async function load() {
        try {
            setLoading(true);
            const s = await listSessions();
            setAllSessions(s);
        } catch (e) {
            setError((e as Error).message);
        } finally { setLoading(false); }
    }

    async function handleRequest(sessionId: number) {
        if (!isLoggedIn) {
            onNavigate?.('login');
            return;
        }
        try {
            await requestJoin(sessionId, 'Hi — I would like to join');
            alert('Request sent');
        } catch (e) {
            alert((e as Error).message);
        }
    }

    // Get unique skills for filter dropdown
    const uniqueSkills = Array.from(
        new Map(
            allSessions
                .filter(s => s.skill)
                .map(s => [s.skill.id, s.skill])
        ).values()
    );

    return (
        <div className="p-6 bg-white rounded shadow animate-fade-in">
            <h2 className="text-xl font-bold mb-6 animate-fade-in-down">Browse Sessions</h2>

            {/* Search and Filters */}
            <div className="mb-6 space-y-4">
                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search sessions by title, description, or host..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Filter Controls */}
                <div className="flex gap-4 flex-wrap">
                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as 'all' | 'open' | 'closed')}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Status</option>
                        <option value="open">Open Only</option>
                        <option value="closed">Closed Only</option>
                    </select>

                    {/* Skill Filter */}
                    <select
                        value={skillFilter}
                        onChange={(e) => setSkillFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Skills</option>
                        {uniqueSkills.map(skill => (
                            <option key={skill.id} value={skill.id}>
                                {skill.name}
                            </option>
                        ))}
                    </select>

                    {/* Reset Filters */}
                    {(searchTerm || statusFilter !== 'all' || skillFilter !== 'all') && (
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setStatusFilter('all');
                                setSkillFilter('all');
                            }}
                            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>

                {/* Results Count */}
                <div className="text-sm text-gray-600">
                    Showing {filteredSessions.length} of {allSessions.length} sessions
                </div>
            </div>

            {loading && <div>Loading sessions...</div>}
            {error && <div className="text-red-600">{error}</div>}

            <div className="space-y-4">
                {filteredSessions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        {allSessions.length === 0 ? 'No sessions available' : 'No sessions match your filters'}
                    </div>
                ) : (
                    filteredSessions.map((s) => (
                        <div key={s.id} className="border border-gray-200 p-4 rounded-lg hover:shadow-md transition animate-fade-in-up">
                            {/* Tags */}
                            <div className="flex flex-wrap gap-2 mb-3">
                                {s.skill && (
                                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                                        {s.skill.name}
                                    </span>
                                )}
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${s.isOpen
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                    }`}>
                                    {s.isOpen ? 'Open' : 'Closed'}
                                </span>
                            </div>

                            {/* Session Content */}
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg">{s.title}</h3>
                                    {s.description && (
                                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{s.description}</p>
                                    )}
                                    <div className="text-sm text-gray-500 mt-2">
                                        Host:{' '}
                                        <button
                                            className="text-blue-600 hover:underline font-medium"
                                            onClick={() => onProfile?.(s.hostProfileId)}
                                        >
                                            {s.hostDisplayName || '—'}
                                        </button>
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        📅 {s.scheduledAt} • ⏱️ {s.durationMinutes} min
                                    </div>
                                </div>
                                <div className="flex gap-2 ml-4 shrink-0">
                                    <button
                                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition text-sm whitespace-nowrap"
                                        onClick={() => handleRequest(s.id)}
                                        disabled={!s.isOpen}
                                    >
                                        {s.isOpen ? 'Request to Join' : 'Closed'}
                                    </button>
                                    <button
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition text-sm whitespace-nowrap"
                                        onClick={() => onView?.(s.id)}
                                    >
                                        View
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
