import React from 'react';

export const AuroraBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 bg-[#F4F6F4] dark:bg-[#080F0A] transition-colors duration-300">
      {/* Orb 1: Forest Emerald */}
      <div 
        className="absolute -top-[15%] -left-[10%] w-[65vw] h-[65vw] max-w-[700px] max-h-[700px] rounded-full bg-[#064E3B] opacity-15 dark:opacity-35 filter blur-[95px] animate-aurora-1 will-change-transform" 
      />

      {/* Orb 2: Deep Pine */}
      <div 
        className="absolute top-[30%] -right-[15%] w-[60vw] h-[60vw] max-w-[650px] max-h-[650px] rounded-full bg-[#065F46] opacity-15 dark:opacity-35 filter blur-[100px] animate-aurora-2 will-change-transform" 
      />

      {/* Orb 3: Warm Amber */}
      <div 
        className="absolute -bottom-[20%] left-[20%] w-[55vw] h-[55vw] max-w-[600px] max-h-[600px] rounded-full bg-[#78350F] opacity-10 dark:opacity-30 filter blur-[90px] animate-aurora-3 will-change-transform" 
      />

      {/* Subtle fine mesh grid texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04] bg-[radial-gradient(currentColor_1px,transparent_1px)] [background-size:24px_24px] text-emerald-950 dark:text-emerald-300"
      />
    </div>
  );
};
