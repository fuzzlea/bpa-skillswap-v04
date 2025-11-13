import { useEffect, useState } from 'react';
import { getMyProfile, saveProfile, getSkills } from '../services/profile';

export default function ProfileEditor() {
    const [profile, setProfile] = useState<any>(null);
    const [skills, setSkills] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const p = await getMyProfile();
                setProfile(p);
            } catch (e) {
                setError((e as Error).message);
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
            alert('Profile saved');
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="text-red-600">{error}</div>;

    return (
        <div className="p-6 bg-white rounded shadow">
            <h2 className="text-xl font-bold mb-4">Edit My Profile</h2>
            <div className="space-y-3">
                <label className="block">
                    <div className="text-sm">Display Name</div>
                    <input className="border p-2 w-full" value={profile?.displayName ?? ''} onChange={e => setProfile({ ...profile, displayName: e.target.value })} />
                </label>
                <label className="block">
                    <div className="text-sm">Bio</div>
                    <textarea className="border p-2 w-full" value={profile?.bio ?? ''} onChange={e => setProfile({ ...profile, bio: e.target.value })} />
                </label>
                <label className="block">
                    <div className="text-sm">Location</div>
                    <input className="border p-2 w-full" value={profile?.location ?? ''} onChange={e => setProfile({ ...profile, location: e.target.value })} />
                </label>
                <label className="block">
                    <div className="text-sm">Contact</div>
                    <input className="border p-2 w-full" value={profile?.contact ?? ''} onChange={e => setProfile({ ...profile, contact: e.target.value })} />
                </label>

                <div>
                    <div className="text-sm font-medium">Skills Offered</div>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {skills.map(s => (
                            <button key={s.id} className={`px-3 py-1 border rounded ${profile?.skillsOffered?.some((x: any) => x.id === s.id) ? 'bg-blue-200' : ''}`} onClick={() => {
                                const offered = profile?.skillsOffered ?? [];
                                const exists = offered.find((x: any) => x.id === s.id);
                                if (exists) {
                                    setProfile({ ...profile, skillsOffered: offered.filter((x: any) => x.id !== s.id) });
                                } else {
                                    setProfile({ ...profile, skillsOffered: [...offered, s] });
                                }
                            }}>{s.name}</button>
                        ))}
                    </div>
                </div>

                <div>
                    <div className="text-sm font-medium">Skills Wanted</div>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {skills.map(s => (
                            <button key={s.id} className={`px-3 py-1 border rounded ${profile?.skillsWanted?.some((x: any) => x.id === s.id) ? 'bg-green-200' : ''}`} onClick={() => {
                                const wanted = profile?.skillsWanted ?? [];
                                const exists = wanted.find((x: any) => x.id === s.id);
                                if (exists) {
                                    setProfile({ ...profile, skillsWanted: wanted.filter((x: any) => x.id !== s.id) });
                                } else {
                                    setProfile({ ...profile, skillsWanted: [...wanted, s] });
                                }
                            }}>{s.name}</button>
                        ))}
                    </div>
                </div>

                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleSave}>Save</button>
                </div>
            </div>
        </div>
    );
}
