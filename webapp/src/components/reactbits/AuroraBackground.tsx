import React from 'react';

export const AuroraBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 bg-[#080F0A]">
      {/* Orb 1: Emerald glow */}
      <div 
        className="absolute -top-[15%] -left-[10%] w-[65vw] h-[65vw] max-w-[700px] max-h-[700px] rounded-full bg-[#065F46] opacity-35 filter blur-[95px] animate-aurora-1 will-change-transform" 
      />

      {/* Orb 2: Deep Pine glow */}
      <div 
        className="absolute top-[35%] -right-[15%] w-[60vw] h-[60vw] max-w-[650px] max-h-[650px] rounded-full bg-[#064E3B] opacity-35 filter blur-[100px] animate-aurora-2 will-change-transform" 
      />

      {/* Orb 3: Warm Amber grain glow */}
      <div 
        className="absolute -bottom-[20%] left-[20%] w-[55vw] h-[55vw] max-w-[600px] max-h-[600px] rounded-full bg-[#78350F] opacity-30 filter blur-[90px] animate-aurora-3 will-change-transform" 
      />

      {/* Subtle fine mesh grid texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:24px_24px]"
      />
    </div>
  );
};
