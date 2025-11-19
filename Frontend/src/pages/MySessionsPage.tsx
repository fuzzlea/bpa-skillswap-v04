import React, { useEffect, useState } from 'react';
import { listSessions, createSession, deleteSession, updateSession } from '../services/sessions';
import { getSkills, getProfiles } from '../services/profile';
import { getCurrentUser, getToken } from '../services/auth';
import { Plus, MessageSquare, Sliders } from 'lucide-react';

export default function MySessionsPage({ onNavigate }: { onNavigate?: (route: string) => void; }) {
    const isLoggedIn = !!getToken();
    const [userSessions, setUserSessions] = useState<any[]>([]);
    const [allSessions, setAllSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [userProfileId, setUserProfileId] = useState<number | null>(null);
    const [editingSessionId, setEditingSessionId] = useState<number | null>(null);

    // Redirect to login if not logged in
    if (!isLoggedIn) {
        setTimeout(() => onNavigate?.('login'), 0);
        return <div className="p-6 text-center">Redirecting to login...</div>;
    }

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [skillId, setSkillId] = useState<number | null>(null);
    const [scheduledAt, setScheduledAt] = useState('');
    const [duration, setDuration] = useState(60);
    const [skills, setSkills] = useState<any[]>([]);
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const currentUser = getCurrentUser();

    useEffect(() => {
        async function loadUserProfile() {
            try {
                const profiles = await getProfiles();
                const userProfile = profiles.find((p: any) => p.userId === currentUser?.id);
                if (userProfile) {
                    setUserProfileId(userProfile.id);
                }
            } catch (e) {
                console.error('Failed to load user profile:', e);
            }
        }

        loadUserProfile();
        loadSessions();
        loadSkills();
    }, [currentUser?.id]);

    async function loadSessions() {
        try {
            setLoading(true);
            const allSess = await listSessions();
            setAllSessions(allSess);

            // Filter to sessions hosted by current user (we'll use userProfileId once loaded)
            // For now, set empty and will refetch after userProfileId is determined
            setUserSessions([]);
            setError(null);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setLoading(false);
        }
    }

    // Update sessions list when userProfileId is determined
    useEffect(() => {
        if (userProfileId !== null && allSessions.length > 0) {
            const userHost = allSessions.filter(
                (s: any) => s.hostProfileId === userProfileId
            );
            setUserSessions(userHost);
        }
    }, [userProfileId, allSessions]);

    async function loadSkills() {
        try {
            const s = await getSkills();
            setSkills(s);
        } catch (e) {
            console.error('Failed to load skills:', e);
        }
    }

    function resetForm() {
        setTitle('');
        setDescription('');
        setSkillId(null);
        setScheduledAt('');
        setDuration(60);
        setFormError(null);
    }

    function startEdit(session: any) {
        setEditingSessionId(session.id);
        setTitle(session.title);
        setDescription(session.description || '');
        setSkillId(session.skill?.id || null);
        // Convert ISO string to datetime-local format
        const date = new Date(session.scheduledAt);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        setScheduledAt(`${year}-${month}-${day}T${hours}:${minutes}`);
        setDuration(session.durationMinutes);
        setShowCreateForm(true);
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!scheduledAt) {
            setFormError('Please choose a date and time for the session.');
            return;
        }
        setFormLoading(true);
        setFormError(null);
        try {
            const iso = new Date(scheduledAt).toISOString();

            if (editingSessionId !== null) {
                // Update existing session
                await updateSession(editingSessionId, {
                    title,
                    description,
                    skillId,
                    scheduledAt: iso,
                    durationMinutes: duration,
                });
            } else {
                // Create new session
                await createSession({
                    title,
                    description,
                    skillId,
                    scheduledAt: iso,
                    durationMinutes: duration,
                } as any);
            }

            // Reset form and reload sessions
            resetForm();
            setShowCreateForm(false);
            setEditingSessionId(null);
            await loadSessions();
        } catch (err) {
            setFormError((err as Error).message);
        } finally {
            setFormLoading(false);
        }
    }

    async function handleDelete(sessionId: number) {
        if (!confirm('Are you sure you want to delete this session?')) return;
        try {
            await deleteSession(sessionId);
            await loadSessions();
        } catch (err) {
            setError((err as Error).message);
        }
    }

    function cancelEdit() {
        setShowCreateForm(false);
        setEditingSessionId(null);
        resetForm();
    }

    if (loading) return <div className="p-6">Loading sessions...</div>;

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">My Sessions</h2>
                    <button
                        onClick={() => onNavigate?.('managereqs')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                    >
                        <MessageSquare size={18} />
                        Manage Requests
                    </button>
                </div>

                {error && <div className="p-4 mb-4 bg-red-50 text-red-700 border border-red-200 rounded-lg">{error}</div>}

                {/* Create Session Button / Form */}
                {!showCreateForm ? (
                    <button
                        onClick={() => {
                            resetForm();
                            setShowCreateForm(true);
                        }}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Create New Session
                    </button>
                ) : (
                    <div className="border p-4 rounded bg-gray-50">
                        <h3 className="font-semibold mb-3">
                            {editingSessionId !== null ? 'Edit Session' : 'Create New Session'}
                        </h3>
                        {formError && <div className="p-2 bg-red-100 text-red-700 rounded mb-3">{formError}</div>}
                        <form onSubmit={handleCreate} className="space-y-3">
                            <input
                                className="w-full border p-2"
                                placeholder="Title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                            <textarea
                                className="w-full border p-2"
                                placeholder="Description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                            <select
                                className="w-full border p-2"
                                value={skillId ?? ''}
                                onChange={(e) => setSkillId(e.target.value ? Number(e.target.value) : null)}
                            >
                                <option value="">-- Select skill (optional) --</option>
                                {skills.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                            <div className="flex gap-2">
                                <input
                                    required
                                    type="datetime-local"
                                    className="border p-2 flex-1"
                                    value={scheduledAt}
                                    onChange={(e) => setScheduledAt(e.target.value)}
                                />
                                <input
                                    required
                                    type="number"
                                    min="1"
                                    className="border p-2 w-24"
                                    value={duration}
                                    onChange={(e) => setDuration(Number(e.target.value))}
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                                    disabled={formLoading}
                                >
                                    {formLoading ? (editingSessionId ? 'Updating...' : 'Creating...') : (editingSessionId ? 'Update Session' : 'Create Session')}
                                </button>
                                <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            {/* Sessions List */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold mb-4">
                    {userSessions.length === 0 ? 'No sessions created yet' : `Your Sessions (${userSessions.length})`}
                </h3>
                <div className="space-y-3">
                    {userSessions.map((s) => (
                        <div key={s.id} className="border p-4 rounded hover:bg-gray-50">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="font-semibold text-lg">{s.title}</div>
                                    <div className="text-sm text-gray-600 mt-1">{s.description}</div>
                                    <div className="text-sm text-gray-500 mt-2">
                                        📅 {new Date(s.scheduledAt).toLocaleString()} • ⏱️ {s.durationMinutes} min
                                    </div>
                                    {s.skillName && (
                                        <div className="text-sm text-gray-500 mt-1">📚 Skill: {s.skillName}</div>
                                    )}
                                    <div className="text-sm text-gray-500 mt-1">
                                        Status: {s.isOpen ? '✅ Open' : '❌ Closed'}
                                    </div>
                                </div>
                                <div className="flex gap-2 ml-2">
                                    {!s.isOpen && (
                                        <button
                                            onClick={() => onNavigate?.(`manage-session-${s.id}`)}
                                            className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-1"
                                        >
                                            <Sliders size={16} />
                                            Manage
                                        </button>
                                    )}
                                    <button
                                        onClick={() => startEdit(s)}
                                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(s.id)}
                                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
