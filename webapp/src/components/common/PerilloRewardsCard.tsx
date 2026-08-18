import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ShieldCheck } from 'lucide-react';
import { CountUp } from '../reactbits/CountUp';

interface PerilloRewardsCardProps {
  userName: string;
  userId: string;
  pointsBalance: number;
  tier: string;
  tierRewardPct?: number;
}

const TIER_MAP: Record<string, { bg: string; label: string; pillColor: string; cashback: string }> = {
  Member: {
    bg: '/cards/tier-member.png',
    label: 'MEMBER',
    pillColor: 'bg-emerald-950/60 border-emerald-400/40 text-emerald-300',
    cashback: '0.8% Cashback',
  },
  Bronze: {
    bg: '/cards/tier-bronze.png',
    label: 'BRONZE',
    pillColor: 'bg-amber-950/60 border-amber-400/40 text-amber-300',
    cashback: '1.0% Cashback',
  },
  Silver: {
    bg: '/cards/tier-silver.png',
    label: 'SILVER',
    pillColor: 'bg-slate-900/60 border-slate-300/40 text-slate-200',
    cashback: '1.5% Cashback',
  },
  Gold: {
    bg: '/cards/tier-bronze.png',
    label: 'GOLD',
    pillColor: 'bg-amber-950/60 border-yellow-400/50 text-yellow-300',
    cashback: '2.0% Cashback',
  },
  Platinum: {
    bg: '/cards/tier-pro.png',
    label: 'PRO FLAGSHIP',
    pillColor: 'bg-black/60 border-amber-400/50 text-amber-300',
    cashback: '2.5% Cashback',
  },
  Pro: {
    bg: '/cards/tier-pro.png',
    label: 'PRO FLAGSHIP',
    pillColor: 'bg-black/60 border-amber-400/50 text-amber-300',
    cashback: '2.5% Cashback',
  },
};

export const PerilloRewardsCard: React.FC<PerilloRewardsCardProps> = ({
  userName,
  userId,
  pointsBalance,
  tier,
  tierRewardPct,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const tierConfig = TIER_MAP[tier] || TIER_MAP.Member;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xPct = (x / rect.width - 0.5) * 2;
    const yPct = (y / rect.height - 0.5) * 2;

    setRotateX(-yPct * 12);
    setRotateY(xPct * 12);
    setGlarePos({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  const formatCardNumber = (id: string) => {
    const clean = (id || 'P987654').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    return `PERILLO • ${clean.slice(0, 4) || 'P987'} • ${clean.slice(4, 8) || '654'}`;
  };

  return (
    <div style={{ perspective: '1200px' }} className="w-full max-w-xl mx-auto">
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        animate={{
          rotateX,
          rotateY,
          scale: isHovered ? 1.02 : 1,
        }}
        transition={{ type: 'spring', stiffness: 220, damping: 20 }}
        style={{
          transformStyle: 'preserve-3d',
          backgroundImage: `url("${tierConfig.bg}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        className="relative w-full aspect-[1.586/1] rounded-2xl border border-white/10 shadow-2xl overflow-hidden cursor-pointer select-none"
      >
        {/* Dynamic Light Sheen / Reflection Overlay */}
        <div
          className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-300"
          style={{
            opacity: isHovered ? 0.35 : 0,
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.4) 0%, transparent 60%)`,
          }}
        />

        {/* Ambient Dark Gradient Layer to ensure high text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/30 z-10" />

        {/* Card Content Layer */}
        <div className="relative z-20 h-full p-5 sm:p-7 flex flex-col justify-between text-white">
          {/* Top Row: Brand & Dynamic Frosted Tier Pill */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-white p-0.5 shadow-md border border-white/30">
                <img
                  src="https://perilloplywood.in/wp-content/uploads/2025/06/cropped-footerlogo-270x270.jpg"
                  alt="Perillo Logo"
                  className="w-full h-full object-cover rounded-md"
                />
              </div>
              <div>
                <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-white drop-shadow-md block">
                  Perillo Rewards Pass
                </span>
                <span className="text-[9px] sm:text-[10px] text-emerald-300/90 font-medium">
                  Hubballi Manufacturing HQ
                </span>
              </div>
            </div>

            {/* Frosted Tier Pill */}
            <div className={`px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full backdrop-blur-md border shadow-lg flex items-center space-x-1.5 ${tierConfig.pillColor}`}>
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wide">
                {tierConfig.label}
              </span>
            </div>
          </div>

          {/* Center: Large Points Value */}
          <div className="my-auto py-1">
            <span className="text-[11px] sm:text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-0.5">
              Available Balance
            </span>
            <div className="flex items-baseline space-x-2">
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight drop-shadow-lg">
                <CountUp to={pointsBalance || 0} duration={1.6} />
              </h2>
              <span className="text-lg sm:text-2xl font-bold text-emerald-300">Pts</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-amber-300 drop-shadow-md mt-1">
              ₹{(pointsBalance || 0).toLocaleString()} INR • 1 Pt = ₹1
            </p>
          </div>

          {/* Bottom Row: Cardholder Name & Membership Number */}
          <div className="flex items-end justify-between pt-2 border-t border-white/15">
            <div>
              <p className="text-[9px] sm:text-[10px] font-medium text-slate-300 uppercase tracking-wider">
                Cardholder
              </p>
              <p className="text-xs sm:text-base font-bold text-white uppercase tracking-wide mt-0.5 drop-shadow-sm">
                {userName || 'Raju Carpenter'}
              </p>
            </div>

            <div className="text-right">
              <p className="text-[9px] sm:text-[10px] font-medium text-slate-300 uppercase tracking-wider">
                Membership No
              </p>
              <p className="text-xs sm:text-sm font-bold text-emerald-300 tracking-wider mt-0.5">
                {formatCardNumber(userId)}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
