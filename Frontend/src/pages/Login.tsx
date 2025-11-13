import { useState } from 'react';
import { login } from '../services/auth';

export default function Login({ onSuccess }: { onSuccess: () => void }) {
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const formValid = userName.trim().length > 0 && password.length > 0;

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formValid) { setError('Please enter username and password'); return; }
        setLoading(true);
        try {
            await login({ userName, password });
            onSuccess();
        } catch (err: any) {
            setError(err.message ?? 'Login failed');
        } finally { setLoading(false); }
    };

    return (
        <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded shadow">
            <h2 className="text-2xl mb-4">Welcome back</h2>
            {error && <div className="text-red-600 mb-2">{error}</div>}
            <form onSubmit={submit} className="space-y-4">
                <label className="block">
                    <div className="text-sm text-gray-600">Username</div>
                    <input className="w-full border p-2 mt-1 rounded" placeholder="Username" value={userName} onChange={e => setUserName(e.target.value)} />
                </label>
                <label className="block">
                    <div className="text-sm text-gray-600">Password</div>
                    <input className="w-full border p-2 mt-1 rounded" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
                </label>
                <button disabled={!formValid || loading} className="w-full bg-blue-600 text-white p-2 rounded disabled:opacity-50">{loading ? 'Signing in…' : 'Sign in'}</button>
            </form>
        </div>
    );
}
