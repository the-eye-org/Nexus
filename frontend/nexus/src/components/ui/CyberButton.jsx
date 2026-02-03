import React from 'react';
import { motion } from 'framer-motion';

const CyberButton = ({ children, onClick, type = 'button', disabled = false, className = '', variant = 'primary' }) => {
    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`relative px-6 py-3 font-mono font-bold uppercase tracking-widest overflow-hidden group transition-all duration-300 ${className}
        ${variant === 'primary'
                    ? 'border border-neon-green text-neon-green hover:text-black hover:shadow-[0_0_20px_#00ff41]'
                    : 'border border-neon-red text-neon-red hover:text-black hover:shadow-[0_0_20px_#ff003c]'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <span className="relative z-10 flex items-center justify-center gap-2">
                {children}
            </span>
            <div className={`absolute inset-0 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out -z-0
        ${variant === 'primary' ? 'bg-neon-green' : 'bg-neon-red'}`}
            />
        </motion.button>
    );
};

export default CyberButton;
