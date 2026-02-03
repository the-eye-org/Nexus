import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Shield, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CyberInput from '../components/ui/CyberInput';
import CyberButton from '../components/ui/CyberButton';

const Signup = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [validations, setValidations] = useState({
        format: false,
        length: false
    });

    const { signup } = useAuth();
    const navigate = useNavigate();

    // Strict Regex: 2[a-zA-Z0-9]{5}@psgtech.ac.in
    const EMAIL_REGEX = /^2[a-zA-Z0-9]{5}@psgtech\.ac\.in$/;

    useEffect(() => {
        setValidations({
            format: EMAIL_REGEX.test(formData.email),
            length: formData.password.length >= 6
        });
    }, [formData]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validations.format) {
            setError('Invalid ID format. Must be 2XXXXX@psgtech.ac.in');
            return;
        }

        const result = await signup(formData.email, formData.password);
        if (result.success) {
            navigate('/login');
        } else {
            setError(result.error);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            <div className="scanline" />

            <div className="absolute inset-0 z-0 opacity-10 pointer-events-none bg-[url('https://media.giphy.com/media/26tn33ai009QWJWpl/giphy.gif')] bg-cover" />

            <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="cyber-box w-full max-w-md p-8 z-10"
            >
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold font-cyber text-neon-green tracking-tighter mb-2">
                        Unit Registration
                    </h1>
                    <p className="text-xs text-neon-cyan tracking-widest uppercase">
                        Create Secure Uplink
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-3 border border-neon-red bg-neon-red/10 text-neon-red font-mono text-sm text-center">
                        [ERROR]: {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="relative">
                        <CyberInput
                            icon={UserPlus}
                            type="text"
                            name="email"
                            placeholder="COLLEGE_ID (2XXXXX@psgtech.ac.in)"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                        {formData.email.length > 0 && (
                            <div className="absolute top-4 right-4 text-xs font-mono">
                                {validations.format ? (
                                    <span className="text-neon-green flex items-center gap-1"><Check size={14} /> VALID</span>
                                ) : (
                                    <span className="text-neon-red flex items-center gap-1"><X size={14} /> INVALID</span>
                                )}
                            </div>
                        )}
                    </div>

                    <CyberInput
                        icon={Shield}
                        type="password"
                        name="password"
                        placeholder="SECURE_PHRASE"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />

                    <div className="mb-6 space-y-2 text-xs font-mono text-gray-500">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${validations.format ? 'bg-neon-green' : 'bg-gray-700'}`} />
                            <span>Format: 2XXXXX@psgtech.ac.in</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${validations.length ? 'bg-neon-green' : 'bg-gray-700'}`} />
                            <span>Pass Length: 6+ chars</span>
                        </div>
                    </div>

                    <CyberButton
                        type="submit"
                        className="w-full"
                        disabled={!validations.format || !validations.length}
                    >
                        Establish Link
                    </CyberButton>
                </form>

                <div className="mt-6 text-center">
                    <Link to="/login" className="text-gray-500 font-mono text-sm hover:text-neon-cyan transition-colors">
                        {'< Abort & Return to Login'}
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default Signup;
