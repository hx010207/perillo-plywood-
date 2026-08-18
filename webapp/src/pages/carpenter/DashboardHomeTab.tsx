import React, { useState, useEffect } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { User, Stats, Invoice } from '../../types';
import { fetchInvoices } from '../../services/api';
import { Camera, CheckCircle2, Clock, FileText, ChevronRight, Gift, Trophy, ArrowUpRight, Sparkles, ShieldCheck, CreditCard, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { HolographicCard } from '../../components/reactbits/HolographicCard';
import { SpotlightCard } from '../../components/reactbits/SpotlightCard';
import { CountUp } from '../../components/reactbits/CountUp';
import { Magnet } from '../../components/reactbits/Magnet';

const TIER_CONFIG: Record<string, { icon: string; color: string; bg: string; next: number | null; rewardPct: number }> = {
  Member:   { icon: '🪵', color: '#94A3B8', bg: '#F1F5F9', next: 100, rewardPct: 0.8 },
  Bronze:   { icon: '🥉', color: '#D97706', bg: '#FEF3C7', next: 400, rewardPct: 1.0 },
  Silver:   { icon: '🥈', color: '#CBD5E1', bg: '#F8FAFC', next: 700, rewardPct: 1.5 },
  Gold:     { icon: '🥇', color: '#F59E0B', bg: '#FEF9C3', next: 1000, rewardPct: 2.0 },
  Platinum: { icon: '💎', color: '#A855F7', bg: '#F3E8FF', next: null, rewardPct: 2.5 }
};

const MILESTONES = [
  { sheets: 100, gift: 'Branded Utility Kit' },
  { sheets: 400, gift: 'Professional Tool Support Gift' },
  { sheets: 700, gift: 'Premium Power Tool Kit' },
  { sheets: 1000, gift: 'Elite Top-Tier Cashback & VIP Benefits' }
];

interface DashboardHomeTabProps {
  user: User;
  stats: Stats;
  onNavigateUpload: () => void;
  onViewLedgerItem: (item: Invoice) => void;
  refreshKey: number;
}

export const DashboardHomeTab: React.FC<DashboardHomeTabProps> = ({
  user,
  stats,
  onNavigateUpload,
  onViewLedgerItem,
  refreshKey,
}) => {
  const { t } = useI18n();
  const [recentClaims, setRecentClaims] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);

  const loadRecentClaims = async () => {
    try {
      const data = await fetchInvoices(user.id);
      setRecentClaims(data.slice(0, 4));
    } catch (err) {
      console.warn('Error fetching recent claims:', err);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadRecentClaims().finally(() => setLoading(false));
  }, [user.id, refreshKey]);

  useEffect(() => {
    loadRecentClaims();
  }, [stats.pointsBalance, stats.pendingClaims]);

  const tierCfg = TIER_CONFIG[stats.tier] || TIER_CONFIG.Member;
  const totalSheets = stats.totalSheets || 0;
  const nextTierSheets = stats.nextTierSheets || 100;
  const progressPct = nextTierSheets ? Math.min((totalSheets / nextTierSheets) * 100, 100) : 100;
  const nextMilestone = MILESTONES.find(m => totalSheets < m.sheets) || MILESTONES[0];
  const sheetsLeft = Math.max(0, nextMilestone.sheets - totalSheets);

  const formatCardNumber = (id: string) => {
    const clean = id.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    return `PERILLO • ${clean.slice(0, 4) || 'P987'} • ${clean.slice(4, 8) || '654'}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 shadow-xs';
      case 'Rejected':
        return 'bg-rose-500/20 text-rose-300 border-rose-400/40 shadow-xs';
      default:
        return 'bg-amber-500/20 text-amber-300 border-amber-400/30 shadow-xs';
    }
  };

  return (
    <div className="space-y-6 pb-28 sm:pb-12 max-w-5xl mx-auto">
      {/* 1. User Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-3xl bg-[#0e1711]/80 backdrop-blur-xl border border-white/10 shadow-glass"
      >
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1E4620] to-[#0A160D] flex items-center justify-center text-white font-black text-xl shadow-lg border border-emerald-500/30">
            {(user.name || 'R').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                NAMASTE 🙏
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-display text-white tracking-tight">
              {user.name || 'Raju Carpenter'}
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              {user.phone ? `+91 ${user.phone}` : `ID: ${user.id}`}
            </p>
          </div>
        </div>

        <div className="self-start sm:self-auto">
          {stats.verified ? (
            <div className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-glow-emerald">
              <ShieldCheck className="w-4 h-4 mr-1.5 text-emerald-400" />
              <span>Verified Account</span>
            </div>
          ) : (
            <div className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
              <Clock className="w-4 h-4 mr-1.5 text-amber-400" />
              <span>Verification Pending</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* 2. 3D Holographic "Perillo Rewards Pass" */}
      <HolographicCard intensity={14} className="bg-gradient-to-br from-[#132817] via-[#0b170f] to-[#060c08] border border-emerald-500/30 p-6 sm:p-8 text-white shadow-2xl space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="emv-chip" title="Loyalty Smart Chip" />
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-emerald-300 block">
                PERILLO REWARDS PASS
              </span>
              <span className="text-[9px] font-mono text-slate-400">SECURE WALLET • HUBBALLI</span>
            </div>
          </div>

          {/* Membership Tier Pill */}
          <div className="flex items-center space-x-2 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/15 shadow-inner">
            <span className="text-lg">{tierCfg.icon}</span>
            <div className="text-right">
              <span className="block text-[11px] font-black uppercase tracking-wider text-amber-300">
                {stats.tier} Tier
              </span>
              <span className="block text-[9px] font-bold text-emerald-300">
                {tierCfg.rewardPct}% Cashback
              </span>
            </div>
          </div>
        </div>

        {/* Balance Display */}
        <div className="my-3">
          <span className="text-[11px] font-mono font-bold tracking-widest text-emerald-400 uppercase block mb-1">
            {t('pointsBalance')}
          </span>
          <div className="flex items-baseline space-x-3">
            <h3 className="text-4xl sm:text-5xl font-black font-mono text-white tracking-tight drop-shadow-md">
              <CountUp to={stats.pointsBalance || 0} duration={1.6} />
            </h3>
            <span className="text-emerald-400 font-bold text-xl">{t('pts')}</span>
          </div>
          <div className="inline-flex items-center space-x-2 mt-2 bg-black/30 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <p className="text-xs font-bold text-amber-300 font-mono">
              = ₹{(stats.pointsBalance || 0).toLocaleString()} INR (1 Pt = ₹1)
            </p>
          </div>
        </div>

        {/* Card Bottom Meta */}
        <div className="flex items-end justify-between border-t border-emerald-500/20 pt-3 text-xs font-mono text-emerald-200">
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold">Cardholder</p>
            <p className="font-bold text-white font-sans uppercase text-xs sm:text-sm tracking-wide mt-0.5">
              {user.name || 'Raju Carpenter'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase font-bold">Membership No</p>
            <p className="font-mono text-emerald-300 text-xs sm:text-sm font-semibold">
              {formatCardNumber(user.id)}
            </p>
          </div>
        </div>
      </HolographicCard>

      {/* 3. Loyalty Progress Tracker & Milestone Banner */}
      <SpotlightCard className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black font-display text-white">
                {t('loyaltyProgress')}
              </h3>
              <p className="text-xs text-slate-400">Cumulative verified plywood sheets</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-sm font-mono font-black text-amber-300">
              {totalSheets} / {nextTierSheets} Sheets
            </span>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="w-full h-3.5 bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/10 shadow-inner">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 shadow-sm"
          />
        </div>

        {/* Milestone Banner with Pulsing Amber Glow */}
        {nextMilestone && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-xs font-semibold text-amber-200 flex items-center justify-between shadow-glow-amber">
            <div className="flex items-center space-x-2.5">
              <Gift className="w-5 h-5 text-amber-400 flex-shrink-0 animate-pulse" />
              <span>
                🎁 Next gift at <strong>{nextMilestone.sheets} Sheets</strong>: {nextMilestone.gift}
              </span>
            </div>
            <span className="text-[10px] font-mono font-black text-amber-300 uppercase tracking-wider bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-400/30">
              {sheetsLeft} SHEETS LEFT
            </span>
          </div>
        )}
      </SpotlightCard>

      {/* 4. Summary KPI Cards (ReactBits SpotlightCard) */}
      <div className="grid grid-cols-3 gap-3.5 sm:gap-4">
        <SpotlightCard
          spotlightColor="rgba(245, 158, 11, 0.2)"
          borderColor="rgba(245, 158, 11, 0.3)"
          className="p-4 sm:p-5"
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              PENDING
            </p>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <h4 className="text-2xl sm:text-3xl font-black font-mono text-amber-400 mt-2">
            <CountUp to={stats.pendingClaims} />
          </h4>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5">Verification in queue</p>
        </SpotlightCard>

        <SpotlightCard
          spotlightColor="rgba(16, 185, 129, 0.2)"
          borderColor="rgba(16, 185, 129, 0.3)"
          className="p-4 sm:p-5"
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              APPROVED
            </p>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <h4 className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 mt-2">
            <CountUp to={stats.approvedClaims} />
          </h4>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5">Points credited</p>
        </SpotlightCard>

        <SpotlightCard
          spotlightColor="rgba(56, 189, 248, 0.2)"
          borderColor="rgba(56, 189, 248, 0.3)"
          className="p-4 sm:p-5"
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              TOTAL SHEETS
            </p>
            <Trophy className="w-4 h-4 text-sky-400" />
          </div>
          <h4 className="text-2xl sm:text-3xl font-black font-mono text-white mt-2">
            <CountUp to={stats.totalSheets || 0} />
          </h4>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5">Lifetime verified</p>
        </SpotlightCard>
      </div>

      {/* 5. Recent Uploads Grid */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base sm:text-lg font-black font-display text-white flex items-center space-x-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <span>{t('recentUploads')}</span>
          </h3>
          <button
            onClick={loadRecentClaims}
            className="text-xs font-bold text-slate-400 hover:text-emerald-400 flex items-center space-x-1 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('pullRefresh')}</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 bg-[#0e1611]/60 rounded-3xl border border-white/10 text-slate-400 text-xs font-mono">
            Loading recent invoices...
          </div>
        ) : recentClaims.length === 0 ? (
          <SpotlightCard className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
              <Camera className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">{t('noHistory')}</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">{t('uploadFirst')}</p>
            <button
              onClick={onNavigateUpload}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-transform active:scale-95"
            >
              {t('uploadInvoice')}
            </button>
          </SpotlightCard>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {recentClaims.map((item) => (
              <SpotlightCard
                key={item.id}
                className="p-4 sm:p-5 cursor-pointer group press-scale"
              >
                <div onClick={() => onViewLedgerItem(item)} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 transition-colors flex-shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                        {item.store_name || item.dealer_name || 'Dealer Store'}
                      </h4>
                      <p className="text-xs text-amber-300 font-semibold mt-0.5">
                        {item.dealer_city ? `${item.dealer_city} • ` : ''}{item.product_type} ({item.quantity} Sheets)
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Inv #{item.invoice_number} · {item.purchase_date}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-1.5 flex-shrink-0">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-black uppercase tracking-wider border ${getStatusBadge(item.status)}`}>
                      {item.status === 'Approved' ? `APPROVED +${item.points_earned} Pts` : item.status}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                  </div>
                </div>
              </SpotlightCard>
            ))}
          </div>
        )}
      </div>

      {/* 6. Global Sticky Action Button with ReactBits Magnet physics */}
      <div className="fixed bottom-20 right-4 sm:bottom-8 sm:right-8 z-30">
        <Magnet strength={0.3}>
          <button
            onClick={onNavigateUpload}
            className="bg-gradient-to-r from-[#D97706] to-[#B45309] hover:from-[#B45309] hover:to-[#92400E] text-white font-black px-6 py-4 rounded-2xl shadow-2xl hover:shadow-amber-500/30 transition-all active:scale-95 flex items-center space-x-2.5 border border-amber-300/40 uppercase text-xs sm:text-sm tracking-wider"
          >
            <Camera className="w-5 h-5 text-amber-200" />
            <span>{t('uploadInvoice')}</span>
          </button>
        </Magnet>
      </div>
    </div>
  );
};
