import { useState } from 'react';
import { register, login } from '../services/auth';
import { ArrowRight } from 'lucide-react';

export default function Register({ onSuccess, onNavigate }: { onSuccess: () => void; onNavigate?: (route: string) => void; }) {
    const [userName, setUserName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const emailValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
    const passwordRules = {
        length: password.length >= 8,
        upper: /[A-Z]/.test(password),
        lower: /[a-z]/.test(password),
        digit: /[0-9]/.test(password),
        symbol: /[^A-Za-z0-9]/.test(password),
    };
    const passwordValid = Object.values(passwordRules).every(Boolean);
    const formValid = userName.trim().length > 0 && emailValid && passwordValid;

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formValid) {
            setError('Please fix validation errors first.');
            return;
        }
        setLoading(true);
        try {
            // Register the user
            const res = await register({ userName, email, password, displayName });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || 'Registration failed');
            }

            // Automatically log in after successful registration
            await login({ userName, password });

            // Call onSuccess which will redirect to profile creation
            onSuccess();
        } catch (err: any) {
            setError(err.message ?? 'Registration failed');
        } finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen flex items-center justify-center -p-6 -m-6">
            <div className="w-full max-w-md">
                {/* Hero Section */}
                <div className="bg-linear-to-br from-green-600 to-green-800 text-white rounded-lg p-8 mb-8">
                    <h1 className="text-3xl font-bold mb-2">Create Account</h1>
                    <p className="text-green-100">Join our community to learn and share skills</p>
                </div>

                {/* Register Form */}
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
                                placeholder="Choose a username"
                                value={userName}
                                onChange={e => setUserName(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                placeholder="Your email address"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${email.length > 0 && !emailValid ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Display Name (optional)
                            </label>
                            <input
                                type="text"
                                placeholder="How you'll appear to others"
                                value={displayName}
                                onChange={e => setDisplayName(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                placeholder="Create a strong password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${password.length > 0 && !passwordValid ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            />
                        </div>

                        {/* Password Requirements */}
                        <div className="p-3 bg-gray-50 rounded-lg text-sm">
                            <div className="font-semibold text-gray-700 mb-2">Password must contain:</div>
                            <ul className="space-y-1">
                                <li className={`flex items-center gap-2 ${passwordRules.length ? 'text-green-600' : 'text-gray-600'}`}>
                                    <span className={`w-4 h-4 rounded-full ${passwordRules.length ? 'bg-green-500' : 'bg-gray-300'}`} />
                                    At least 8 characters
                                </li>
                                <li className={`flex items-center gap-2 ${passwordRules.upper ? 'text-green-600' : 'text-gray-600'}`}>
                                    <span className={`w-4 h-4 rounded-full ${passwordRules.upper ? 'bg-green-500' : 'bg-gray-300'}`} />
                                    Uppercase letter
                                </li>
                                <li className={`flex items-center gap-2 ${passwordRules.lower ? 'text-green-600' : 'text-gray-600'}`}>
                                    <span className={`w-4 h-4 rounded-full ${passwordRules.lower ? 'bg-green-500' : 'bg-gray-300'}`} />
                                    Lowercase letter
                                </li>
                                <li className={`flex items-center gap-2 ${passwordRules.digit ? 'text-green-600' : 'text-gray-600'}`}>
                                    <span className={`w-4 h-4 rounded-full ${passwordRules.digit ? 'bg-green-500' : 'bg-gray-300'}`} />
                                    A number
                                </li>
                                <li className={`flex items-center gap-2 ${passwordRules.symbol ? 'text-green-600' : 'text-gray-600'}`}>
                                    <span className={`w-4 h-4 rounded-full ${passwordRules.symbol ? 'bg-green-500' : 'bg-gray-300'}`} />
                                    A special character
                                </li>
                            </ul>
                        </div>

                        <button
                            type="submit"
                            disabled={!formValid || loading}
                            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                        >
                            {loading ? 'Creating account...' : (
                                <>
                                    Create Account
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Login Link */}
                    <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                        <p className="text-sm text-gray-600 mb-3">Already have an account?</p>
                        <button
                            onClick={() => onNavigate?.('login')}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                        >
                            Sign In
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
