import { useState, useEffect } from 'react';
import type { User } from '../services/admin';
import { getAllUsers, addUser, deleteUser, toggleAdminRole } from '../services/admin';

export default function AdminPanel() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);

    // Add user form state
    const [formData, setFormData] = useState({ userName: '', email: '', password: '', displayName: '' });
    const [formError, setFormError] = useState<string | null>(null);
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => {
        loadUsers();
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

    if (loading) return <div className="p-6">Loading users...</div>;

    return (
        <div className="p-6 bg-white rounded shadow">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">User Management</h2>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    Add User
                </button>
            </div>

            {error && <div className="text-red-600 mb-4">{error}</div>}

            {/* Users table */}
            <div className="overflow-x-auto">
                <table className="w-full border">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="border p-2 text-left">Username</th>
                            <th className="border p-2 text-left">Email</th>
                            <th className="border p-2 text-left">Display Name</th>
                            <th className="border p-2 text-left">Admin</th>
                            <th className="border p-2 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50">
                                <td className="border p-2">{user.userName}</td>
                                <td className="border p-2">{user.email}</td>
                                <td className="border p-2">{user.displayName || '—'}</td>
                                <td className="border p-2">
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={user.roles.includes('Admin')}
                                            onChange={() => handleToggleAdmin(user.id, user.roles)}
                                            className="mr-2"
                                        />
                                        <span>{user.roles.includes('Admin') ? 'Yes' : 'No'}</span>
                                    </label>
                                </td>
                                <td className="border p-2">
                                    <button
                                        onClick={() => handleDeleteUser(user.id)}
                                        disabled={deleting === user.id}
                                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-50"
                                    >
                                        {deleting === user.id ? 'Deleting…' : 'Delete'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
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
    );
}
