import React, { useState } from 'react';
import { Flag, Send, AlertOctagon, CheckCircle } from 'lucide-react';
import client from '../api/client';
import CyberButton from '../components/ui/CyberButton';
import { motion, AnimatePresence } from 'framer-motion';

const FlagSubmission = ({ onSubmitSuccess }) => {
    const [flag, setFlag] = useState('');
    const [status, setStatus] = useState(null); // 'success' | 'error' | null
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!flag.trim()) return;

        setLoading(true);
        setStatus(null);
        setMessage('');

        try {
            const response = await client.post('/flags/submit-flag', { flag });

            const isCorrect = response.data.is_correct;
            if (isCorrect) {
                setStatus('success');
                setMessage(`ACCESS GRANTED +${response.data.points_awarded}`);
                setFlag('');
                if (onSubmitSuccess) onSubmitSuccess();
            } else {
                setStatus('error');
                setMessage('ACCESS DENIED: Invalid Hash');
            }
        } catch (error) {
            setStatus('error');
            // Check for specific backend error messages (like duplicates)
            if (error.response?.data?.duplicate) {
                setMessage('ALREADY CAPTURED');
            } else {
                setMessage(error.response?.data?.error || 'TRANSMISSION FAILED');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="cyber-box p-6 relative overflow-hidden h-full flex flex-col justify-center">
            <h2 className="text-xl font-cyber text-neon-green mb-6 flex items-center gap-2">
                <Flag className="animate-pulse" /> TARGET INTERFACE
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                    <input
                        type="text"
                        value={flag}
                        onChange={(e) => setFlag(e.target.value)}
                        placeholder="PASTE_FLAG_HERE"
                        className="w-full bg-black/50 border-2 border-dashed border-gray-700 p-4 font-mono text-center text-lg text-neon-green focus:border-neon-green focus:shadow-[0_0_15px_#00ff41] outline-none transition-all placeholder-gray-800"
                    />
                </div>

                <CyberButton
                    type="submit"
                    disabled={loading || !flag}
                    className="w-full"
                >
                    {loading ? 'Decrypting...' : 'INJECT CODE'} <Send size={16} />
                </CyberButton>
            </form>

            <AnimatePresence mode='wait'>
                {status && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className={`mt-4 p-4 border flex flex-col items-center justify-center text-center font-bold tracking-widest
              ${status === 'success' ? 'border-neon-green bg-green-900/20 text-neon-green' : 'border-neon-red bg-red-900/20 text-neon-red'}`}
                    >
                        {status === 'success' ? <CheckCircle size={32} className="mb-2" /> : <AlertOctagon size={32} className="mb-2" />}
                        {message}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FlagSubmission;
