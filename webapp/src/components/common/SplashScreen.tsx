import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 2400);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#122814] text-white p-6 select-none"
    >
      <motion.div
        initial={{ scale: 0.4, opacity: 0, rotate: 0 }}
        animate={{ scale: 1, opacity: 1, rotate: 360 }}
        transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
        className="w-44 h-44 sm:w-56 sm:h-56 mb-8 rounded-2xl overflow-hidden shadow-2xl shadow-emerald-900/50 border-2 border-emerald-400/20 bg-white/5 backdrop-blur flex items-center justify-center"
      >
        <img 
          src="https://perilloplywood.in/wp-content/uploads/2025/06/cropped-footerlogo-270x270.jpg" 
          alt="Perillo Plywood" 
          className="w-full h-full object-cover"
        />
      </motion.div>

      <motion.h1 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="text-3xl sm:text-4xl font-black tracking-wide text-white text-center drop-shadow-md"
      >
        Perillo Plywood
      </motion.h1>

      <motion.p 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.5 }}
        className="text-emerald-300 font-semibold italic text-base mt-2 text-center"
      >
        For a smart user...
      </motion.p>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="mt-10 flex items-center space-x-2 text-emerald-400 text-sm font-medium"
      >
        <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        <span>Loading Application...</span>
      </motion.div>
    </motion.div>
  );
};
