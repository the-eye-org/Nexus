import React, { useEffect, useState } from 'react';
import { History, Check, X } from 'lucide-react';
import client from '../api/client';

const SubmissionHistory = ({ refreshTrigger }) => {
    const [submissions, setSubmissions] = useState([]);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await client.get('/flags/submissions');
                setSubmissions(response.data.submissions);
            } catch (error) {
                console.error("History error", error);
            }
        };
        fetchHistory();
    }, [refreshTrigger]);

    return (
        <div className="cyber-box p-6 h-[400px] flex flex-col">
            <h2 className="text-xl font-cyber text-neon-purple mb-4 flex items-center gap-2">
                <History size={18} /> EVENT LOG
            </h2>

            <div className="flex-1 overflow-y-auto pr-2">
                <div className="space-y-2">
                    {submissions.map((sub, index) => (
                        <div
                            key={index}
                            className={`p-3 border-l-2 font-mono text-xs flex justify-between items-center bg-black/40
                ${sub.is_correct ? 'border-neon-green text-neon-green' : 'border-neon-red text-neon-red'}
              `}
                        >
                            <div className="flex flex-col">
                                <span className="font-bold opacity-80">{sub.timestamp ? new Date(sub.timestamp).toLocaleTimeString() : 'Unknown Time'}</span>
                                <span className="opacity-50">{sub.flag_hash.substring(0, 10)}...</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="font-bold">{sub.is_correct ? `+${sub.points}` : 'FAIL'}</span>
                                {sub.is_correct ? <Check size={14} /> : <X size={14} />}
                            </div>
                        </div>
                    ))}

                    {submissions.length === 0 && (
                        <div className="text-center text-gray-600 py-10 font-mono text-xs">
              // NO ACTIVITY LOGGED //
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SubmissionHistory;
