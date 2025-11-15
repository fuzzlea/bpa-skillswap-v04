import { useState } from 'react';
import { login } from '../services/auth';
import { ArrowRight } from 'lucide-react';

export default function Login({ onSuccess, onNavigate }: { onSuccess: () => void; onNavigate?: (route: string) => void; }) {
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
        <div className="min-h-screen flex items-center justify-center -p-6 -m-6">
            <div className="w-full max-w-md">
                {/* Hero Section */}
                <div className="bg-linear-to-br from-blue-600 to-blue-800 text-white rounded-lg p-8 mb-8">
                    <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
                    <p className="text-blue-100">Sign in to your account to continue learning and sharing</p>
                </div>

                {/* Login Form */}
                <div className="bg-white rounded-lg shadow-md p-8">
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Username
                            </label>
                            <input
                                type="text"
                                placeholder="Enter your username"
                                value={userName}
                                onChange={e => setUserName(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!formValid || loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                        >
                            {loading ? 'Signing in...' : (
                                <>
                                    Sign in
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Create Account Link */}
                    <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                        <p className="text-sm text-gray-600 mb-3">New here?</p>
                        <button
                            onClick={() => onNavigate?.('register')}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                        >
                            Create Account
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
