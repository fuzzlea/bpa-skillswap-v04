import React, { useState } from 'react';
import { submitRating } from '../services/ratings';

export default function Ratings() {
    const [sessionId, setSessionId] = useState('');
    const [targetProfileId, setTargetProfileId] = useState('');
    const [score, setScore] = useState(5);
    const [comment, setComment] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            await submitRating({ sessionId: Number(sessionId), targetProfileId: Number(targetProfileId), score, comment });
            alert('Rating submitted');
        } catch (err) {
            alert((err as Error).message);
        }
    }

    return (
        <div className="p-6 bg-white rounded shadow">
            <h2 className="text-xl font-bold mb-4">Submit Rating</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
                <input className="w-full border p-2" placeholder="Session ID" value={sessionId} onChange={e => setSessionId(e.target.value)} />
                <input className="w-full border p-2" placeholder="Target Profile ID" value={targetProfileId} onChange={e => setTargetProfileId(e.target.value)} />
                <div>
                    <label className="mr-2">Score</label>
                    <select value={score} onChange={e => setScore(Number(e.target.value))}>
                        {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </div>
                <textarea className="w-full border p-2" placeholder="Comment" value={comment} onChange={e => setComment(e.target.value)} />
                <div>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded">Submit Rating</button>
                </div>
            </form>
        </div>
    );
}
