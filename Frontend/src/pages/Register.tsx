import { useState } from 'react';
import { register, login } from '../services/auth';

export default function Register({ onSuccess }: { onSuccess: () => void }) {
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
        <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded shadow">
            <h2 className="text-2xl mb-4">Create account</h2>
            {error && <div className="text-red-600 mb-2">{error}</div>}
            <form onSubmit={submit} className="space-y-4">
                <label className="block">
                    <div className="text-sm text-gray-600">Username</div>
                    <input className="w-full border p-2 mt-1 rounded" placeholder="Username" value={userName} onChange={e => setUserName(e.target.value)} />
                </label>
                <label className="block">
                    <div className="text-sm text-gray-600">Email</div>
                    <input className={`w-full border p-2 mt-1 rounded ${email.length > 0 && !emailValid ? 'border-red-500' : ''}`} placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                </label>
                <label className="block">
                    <div className="text-sm text-gray-600">Display name (optional)</div>
                    <input className="w-full border p-2 mt-1 rounded" placeholder="Display name" value={displayName} onChange={e => setDisplayName(e.target.value)} />
                </label>
                <label className="block">
                    <div className="text-sm text-gray-600">Password</div>
                    <input className={`w-full border p-2 mt-1 rounded ${password.length > 0 && !passwordValid ? 'border-red-500' : ''}`} placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
                </label>

                <div className="text-sm text-gray-600">
                    <div>Password must contain:</div>
                    <ul className="list-disc pl-5">
                        <li className={passwordRules.length ? 'text-green-600' : 'text-gray-600'}>At least 8 characters</li>
                        <li className={passwordRules.upper ? 'text-green-600' : 'text-gray-600'}>Uppercase letter</li>
                        <li className={passwordRules.lower ? 'text-green-600' : 'text-gray-600'}>Lowercase letter</li>
                        <li className={passwordRules.digit ? 'text-green-600' : 'text-gray-600'}>A number</li>
                        <li className={passwordRules.symbol ? 'text-green-600' : 'text-gray-600'}>A special character</li>
                    </ul>
                </div>

                <button disabled={!formValid || loading} className="w-full bg-green-600 text-white p-2 rounded disabled:opacity-50">{loading ? 'Creating…' : 'Create account'}</button>
            </form>
        </div>
    );
}
