import React, { useEffect, useState } from 'react';
import { listSessions, createSession } from '../services/sessions';
import { getSkills } from '../services/profile';

export default function CreateSession() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [skillId, setSkillId] = useState<number | null>(null);
    const [scheduledAt, setScheduledAt] = useState('');
    const [duration, setDuration] = useState(60);
    const [skills, setSkills] = useState<any[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                const s = await getSkills();
                setSkills(s);
            } catch { }
            try {
                const ss = await listSessions();
                setSessions(ss);
            } catch { }
        }
        load();
    }, []);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!scheduledAt) {
            alert('Please choose a date and time for the session.');
            return;
        }
        setLoading(true);
        try {
            // Convert local datetime-local input to ISO string
            const iso = new Date(scheduledAt).toISOString();
            await createSession({ title, description, skillId, scheduledAt: iso, durationMinutes: duration } as any);
            alert('Session created');
        } catch (err) {
            alert((err as Error).message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="p-6 bg-white rounded shadow space-y-6">
            <h2 className="text-xl font-bold">Create Session</h2>
            <form onSubmit={handleCreate} className="space-y-3">
                <input className="w-full border p-2" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
                <textarea className="w-full border p-2" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
                <select className="w-full border p-2" value={skillId ?? ''} onChange={e => setSkillId(e.target.value ? Number(e.target.value) : null)}>
                    <option value="">-- Select skill (optional) --</option>
                    {skills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <div className="flex gap-2">
                    <input required type="datetime-local" className="border p-2" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
                    <input required type="number" className="border p-2 w-32" value={duration} onChange={e => setDuration(Number(e.target.value))} />
                </div>
                <div>
                    <button className="px-4 py-2 bg-green-600 text-white rounded" disabled={loading}>Create</button>
                </div>
            </form>

            <div>
                <h3 className="font-bold">Upcoming Sessions</h3>
                <div className="space-y-2 mt-2">
                    {sessions.map(s => (
                        <div key={s.id} className="border p-2 rounded">
                            <div className="font-semibold">{s.title}</div>
                            <div className="text-sm text-gray-600">{s.scheduledAt} • {s.durationMinutes} min</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
