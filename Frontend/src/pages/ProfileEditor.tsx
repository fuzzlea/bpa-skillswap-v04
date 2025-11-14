import { useEffect, useState } from 'react';
import { getMyProfile, saveProfile, getSkills } from '../services/profile';

export default function ProfileEditor() {
    const [profile, setProfile] = useState<any>(null);
    const [skills, setSkills] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [profileExists, setProfileExists] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const p = await getMyProfile();
                setProfile(p);
                setProfileExists(true);
            } catch (e) {
                // Profile doesn't exist - show create form
                setProfileExists(false);
                setProfile({});
            }
            try {
                const s = await getSkills();
                setSkills(s);
            } catch (e) {
                // ignore
            }
            setLoading(false);
        }
        load();
    }, []);

    async function handleSave() {
        try {
            setLoading(true);
            const updated = await saveProfile(profile || {});
            setProfile(updated);
            setProfileExists(true);
            alert(profileExists ? 'Profile updated' : 'Profile created');
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <div className="p-6">Loading...</div>;

    return (
        <div className="p-6 bg-white rounded shadow">
            <h2 className="text-xl font-bold mb-4">{profileExists ? 'Edit My Profile' : 'Create Your Profile'}</h2>

            {error && <div className="p-3 bg-red-100 text-red-700 rounded mb-4">{error}</div>}

            <div className="space-y-3">
                <label className="block">
                    <div className="text-sm font-medium">Display Name *</div>
                    <input
                        className="border p-2 w-full rounded"
                        placeholder="Your name or username"
                        value={profile?.displayName ?? ''}
                        onChange={e => setProfile({ ...profile, displayName: e.target.value })}
                        required
                    />
                </label>
                <label className="block">
                    <div className="text-sm font-medium">Bio</div>
                    <textarea
                        className="border p-2 w-full rounded"
                        placeholder="Tell others about yourself"
                        value={profile?.bio ?? ''}
                        onChange={e => setProfile({ ...profile, bio: e.target.value })}
                        rows={3}
                    />
                </label>
                <label className="block">
                    <div className="text-sm font-medium">Location</div>
                    <input
                        className="border p-2 w-full rounded"
                        placeholder="Your city or region"
                        value={profile?.location ?? ''}
                        onChange={e => setProfile({ ...profile, location: e.target.value })}
                    />
                </label>
                <label className="block">
                    <div className="text-sm font-medium">Contact</div>
                    <input
                        className="border p-2 w-full rounded"
                        placeholder="Email or phone (optional)"
                        value={profile?.contact ?? ''}
                        onChange={e => setProfile({ ...profile, contact: e.target.value })}
                    />
                </label>

                <div>
                    <div className="text-sm font-medium mb-2">Skills You Offer</div>
                    <div className="flex flex-wrap gap-2">
                        {skills.map(s => (
                            <button
                                key={s.id}
                                type="button"
                                className={`px-3 py-1 border rounded transition ${profile?.skillsOffered?.some((x: any) => x.id === s.id) ? 'bg-blue-500 text-white border-blue-500' : 'bg-white border-gray-300 hover:border-blue-500'}`}
                                onClick={() => {
                                    const offered = profile?.skillsOffered ?? [];
                                    const exists = offered.find((x: any) => x.id === s.id);
                                    if (exists) {
                                        setProfile({ ...profile, skillsOffered: offered.filter((x: any) => x.id !== s.id) });
                                    } else {
                                        setProfile({ ...profile, skillsOffered: [...offered, s] });
                                    }
                                }}
                            >
                                {s.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <div className="text-sm font-medium mb-2">Skills You Want to Learn</div>
                    <div className="flex flex-wrap gap-2">
                        {skills.map(s => (
                            <button
                                key={s.id}
                                type="button"
                                className={`px-3 py-1 border rounded transition ${profile?.skillsWanted?.some((x: any) => x.id === s.id) ? 'bg-green-500 text-white border-green-500' : 'bg-white border-gray-300 hover:border-green-500'}`}
                                onClick={() => {
                                    const wanted = profile?.skillsWanted ?? [];
                                    const exists = wanted.find((x: any) => x.id === s.id);
                                    if (exists) {
                                        setProfile({ ...profile, skillsWanted: wanted.filter((x: any) => x.id !== s.id) });
                                    } else {
                                        setProfile({ ...profile, skillsWanted: [...wanted, s] });
                                    }
                                }}
                            >
                                {s.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex gap-3 pt-4">
                    <button
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                        onClick={handleSave}
                        disabled={loading || !profile?.displayName}
                    >
                        {loading ? 'Saving...' : profileExists ? 'Update Profile' : 'Create Profile'}
                    </button>
                </div>
            </div>
        </div>
    );
}
