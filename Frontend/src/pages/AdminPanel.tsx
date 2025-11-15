import { useState, useEffect } from 'react';
import type { User } from '../services/admin';
import { getAllUsers, addUser, deleteUser, toggleAdminRole, getSummary } from '../services/admin';
import { getProfiles } from '../services/profile';
import { getRatingsForProfile, getAverageRating } from '../services/ratings';
import { Users, Plus, Trash2, Shield, AlertCircle } from 'lucide-react';

export default function AdminPanel() {
    const [users, setUsers] = useState<User[]>([]);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [ratings, setRatings] = useState<Record<number, any[]>>({});
    const [averages, setAverages] = useState<Record<number, number>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [summary, setSummary] = useState<any>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'users' | 'profiles'>('users');

    // Add user form state
    const [formData, setFormData] = useState({ userName: '', email: '', password: '', displayName: '' });
    const [formError, setFormError] = useState<string | null>(null);
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => {
        loadUsers();
        loadProfiles();
        loadSummary();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await getAllUsers();
            setUsers(data);
            setError(null);
        } catch (err: any) {
            setError(err.message ?? 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const loadProfiles = async () => {
        try {
            const p = await getProfiles();
            setProfiles(p);

            // Load ratings for each profile
            const map: Record<number, any[]> = {};
            const avgMap: Record<number, number> = {};
            for (const prof of p) {
                try {
                    const r = await getRatingsForProfile(prof.id);
                    map[prof.id] = r;
                    const a = await getAverageRating(prof.id);
                    avgMap[prof.id] = a;
                } catch { }
            }
            setRatings(map);
            setAverages(avgMap);
        } catch (e) {
            console.error('Failed to load profiles:', e);
        }
    };

    const loadSummary = async () => {
        try {
            const s = await getSummary();
            setSummary(s);
        } catch (err: any) {
            // ignore for now
        }
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.userName || !formData.email || !formData.password) {
            setFormError('Username, email, and password are required');
            return;
        }

        setFormLoading(true);
        try {
            await addUser(formData);
            setFormData({ userName: '', email: '', password: '', displayName: '' });
            setFormError(null);
            setShowAddModal(false);
            await loadUsers();
        } catch (err: any) {
            setFormError(err.message);
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        setDeleting(id);
        try {
            await deleteUser(id);
            await loadUsers();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setDeleting(null);
        }
    };

    const handleToggleAdmin = async (id: string, currentRoles: string[]) => {
        const isCurrentlyAdmin = currentRoles.includes('Admin');
        try {
            await toggleAdminRole(id, !isCurrentlyAdmin);
            await loadUsers();
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (loading) return <div className="p-6 text-center">Loading...</div>;

    return (
        <div className="space-y-8">
            {/* Hero Section */}
            <div className="bg-linear-to-r from-purple-600 to-purple-800 text-white rounded-lg p-8 md:p-12">
                <div className="flex items-center gap-3 mb-4">
                    <Shield size={28} />
                    <span className="text-sm font-semibold opacity-90">Admin Panel</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold">System Administration</h1>
                <p className="text-lg opacity-90 mt-2">Manage users, profiles, and monitor platform activity</p>
            </div>

            {/* Summary Section */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center gap-3">
                            <Users className="w-8 h-8 text-blue-600" />
                            <div>
                                <p className="text-gray-600 text-sm font-medium">Total Users</p>
                                <p className="text-3xl font-bold text-gray-900">{summary.totalUsers}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center gap-3">
                            <Users className="w-8 h-8 text-green-600" />
                            <div>
                                <p className="text-gray-600 text-sm font-medium">Profiles</p>
                                <p className="text-3xl font-bold text-gray-900">{summary.totalProfiles}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center gap-3">
                            <Users className="w-8 h-8 text-orange-600" />
                            <div>
                                <p className="text-gray-600 text-sm font-medium">Sessions</p>
                                <p className="text-3xl font-bold text-gray-900">{summary.totalSessions}</p>
                                <p className="text-xs text-green-600 font-semibold mt-1">{summary.openSessions} open</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-8 h-8 text-red-600" />
                            <div>
                                <p className="text-gray-600 text-sm font-medium">Pending Requests</p>
                                <p className="text-3xl font-bold text-gray-900">{summary.pendingRequests}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center gap-3">
                            <Shield className="w-8 h-8 text-yellow-600" />
                            <div>
                                <p className="text-gray-600 text-sm font-medium">Avg Rating</p>
                                <p className="text-3xl font-bold text-gray-900">{Number(summary.averageRating).toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-md">
                <div className="flex gap-0 border-b">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-6 py-4 font-semibold transition ${activeTab === 'users'
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        User Management
                    </button>
                    <button
                        onClick={() => setActiveTab('profiles')}
                        className={`px-6 py-4 font-semibold transition ${activeTab === 'profiles'
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        All Profiles
                    </button>
                </div>

                <div className="p-6">
                    {error && <div className="p-4 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>}

                    {/* Users Tab */}
                    {activeTab === 'users' && (
                        <>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold">User Management</h2>
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                                >
                                    <Plus size={18} />
                                    Add User
                                </button>
                            </div>

                            {/* Users table */}
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Username</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Display Name</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Admin</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(user => (
                                            <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                                <td className="px-6 py-4 text-sm text-gray-900">{user.userName}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{user.displayName || '—'}</td>
                                                <td className="px-6 py-4">
                                                    <label className="flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={user.roles.includes('Admin')}
                                                            onChange={() => handleToggleAdmin(user.id, user.roles)}
                                                            className="w-4 h-4 rounded border-gray-300"
                                                        />
                                                        <span className="ml-2 text-sm font-medium text-gray-700">
                                                            {user.roles.includes('Admin') ? 'Yes' : 'No'}
                                                        </span>
                                                    </label>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        disabled={deleting === user.id}
                                                        className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition text-sm font-medium"
                                                    >
                                                        {deleting === user.id ? 'Deleting…' : 'Delete'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {/* Profiles Tab */}
                    {activeTab === 'profiles' && (
                        <>
                            <h2 className="text-2xl font-bold mb-6">All Profiles</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {profiles.map(p => (
                                    <div key={p.id} className="bg-linear-to-br from-white to-gray-50 border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">{p.displayName ?? p.userName}</h3>
                                                {p.location && <p className="text-sm text-gray-600 mt-1">📍 {p.location}</p>}
                                            </div>
                                            {averages[p.id] && (
                                                <div className="text-right">
                                                    <div className="text-2xl font-bold text-yellow-500">⭐ {averages[p.id].toFixed(2)}</div>
                                                    <div className="text-xs text-gray-600 mt-1">{ratings[p.id]?.length ?? 0} ratings</div>
                                                </div>
                                            )}
                                        </div>

                                        {p.bio && <p className="text-sm text-gray-700 mb-4">{p.bio}</p>}

                                        {p.skillsOffered && p.skillsOffered.length > 0 && (
                                            <div className="mb-3">
                                                <p className="text-xs font-semibold text-gray-600 mb-2">OFFERS:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {p.skillsOffered.map((s: any) => (
                                                        <span key={s.id} className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                                                            {s.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {p.skillsWanted && p.skillsWanted.length > 0 && (
                                            <div>
                                                <p className="text-xs font-semibold text-gray-600 mb-2">WANTS:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {p.skillsWanted.map((s: any) => (
                                                        <span key={s.id} className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                                                            {s.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Add user modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="bg-white p-6 rounded shadow max-w-md w-full">
                            <h3 className="text-xl font-bold mb-4">Add New User</h3>
                            {formError && <div className="text-red-600 mb-2">{formError}</div>}
                            <form onSubmit={handleAddUser} className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="Username"
                                    value={formData.userName}
                                    onChange={e => setFormData({ ...formData, userName: e.target.value })}
                                    className="w-full border p-2 rounded"
                                />
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full border p-2 rounded"
                                />
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full border p-2 rounded"
                                />
                                <input
                                    type="text"
                                    placeholder="Display Name (optional)"
                                    value={formData.displayName}
                                    onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                                    className="w-full border p-2 rounded"
                                />
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        disabled={formLoading}
                                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {formLoading ? 'Adding…' : 'Add User'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setShowAddModal(false); setFormError(null); }}
                                        className="flex-1 bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
