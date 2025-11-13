import { useEffect, useState } from 'react';
import { getProfiles } from '../services/profile';
import { getRatingsForProfile, getAverageRating } from '../services/ratings';

export default function Profiles() {
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [ratings, setRatings] = useState<Record<number, any[]>>({});
    const [averages, setAverages] = useState<Record<number, number>>({});

    useEffect(() => {
        async function load() {
            try {
                const p = await getProfiles();
                setProfiles(p);
            } catch (e) {
                setError((e as Error).message);
            } finally {
                setLoading(false);
            }
        }
        load();
        loadRatings();
        async function loadRatings() {
            try {
                const map: Record<number, any[]> = {};
                const avgMap: Record<number, number> = {};
                for (const prof of await getProfiles()) {
                    try {
                        const r = await getRatingsForProfile(prof.id);
                        map[prof.id] = r;
                        const a = await getAverageRating(prof.id);
                        avgMap[prof.id] = a;
                    } catch { }
                }
                setRatings(map);
                setAverages(avgMap);
            } catch { }
        }
    }, []);

    if (loading) return <div>Loading profiles...</div>;
    if (error) return <div className="text-red-600">{error}</div>;

    return (
        <div className="p-6 bg-white rounded shadow">
            <h2 className="text-xl font-bold mb-4">Profiles</h2>
            <div className="space-y-4">
                {profiles.map(p => (
                    <div key={p.id} className="border p-3 rounded">
                        <div className="flex justify-between items-center">
                            <div>
                                <div className="font-bold">{p.displayName ?? p.userName}</div>
                                <div className="text-sm text-gray-600">{p.location}</div>
                            </div>
                            <div className="text-right text-sm">
                                <div><strong>Avg:</strong> {averages[p.id] ? averages[p.id].toFixed(2) : '—'}</div>
                                <div><strong>Ratings:</strong> {ratings[p.id]?.length ?? 0}</div>
                            </div>
                        </div>
                        <p className="mt-2">{p.bio}</p>
                        <div className="mt-2 text-sm">
                            <strong>Offers:</strong> {p.skillsOffered?.map((s: any) => s.name).join(', ') || '—'}
                        </div>
                        <div className="mt-1 text-sm">
                            <strong>Wants:</strong> {p.skillsWanted?.map((s: any) => s.name).join(', ') || '—'}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
