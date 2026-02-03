import React, { useEffect, useState } from 'react';
import { Trophy, RefreshCw, User, Star } from 'lucide-react';
import client from '../api/client';
import { motion } from 'framer-motion';

const Leaderboard = ({ refreshTrigger }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchLeaderboard = async () => {
        try {
            const response = await client.get('/leaderboard/leaderboard?limit=20');
            setData(response.data.leaderboard);
        } catch (error) {
            console.error("Leaderboard error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard();
        const interval = setInterval(fetchLeaderboard, 30000); // Auto refresh every 30s
        return () => clearInterval(interval);
    }, [refreshTrigger]);

    return (
        <div className="cyber-box p-6 h-[400px] flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-cyber text-neon-cyan flex items-center gap-2">
                    <Trophy size={18} /> ELITE RANKINGS
                </h2>
                <button onClick={fetchLeaderboard} className="text-gray-500 hover:text-neon-cyan transition-colors">
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <table className="w-full text-left font-mono">
                    <thead className="text-xs text-gray-500 border-b border-gray-800 sticky top-0 bg-cyber-dark z-10">
                        <tr>
                            <th className="pb-2 pl-2">RANK</th>
                            <th className="pb-2">OPERATOR</th>
                            <th className="pb-2 text-right">SCORE</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {data.map((user, index) => (
                            <motion.tr
                                key={index}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: index * 0.05 }}
                                className={`border-b border-gray-900 hover:bg-white/5 transition-colors
                  ${index === 0 ? 'text-neon-cyan font-bold bg-neon-cyan/5' : 'text-gray-300'}
                `}
                            >
                                <td className="py-2 pl-2">
                                    {index === 0 && <Star size={12} className="inline mr-1 text-neon-cyan animate-pulse" />}
                                    #{user.rank}
                                </td>
                                <td className="py-2 flex items-center gap-2">
                                    <User size={12} className="opacity-50" />
                                    {user.email.split('@')[0]} {/* Mask host for cleaner look */}
                                </td>
                                <td className="py-2 text-right text-neon-green">
                                    {user.total_points}
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>

                {data.length === 0 && !loading && (
                    <div className="text-center text-gray-600 py-10">NO SIGNAL DETECTED</div>
                )}
            </div>
        </div>
    );
};

export default Leaderboard;
