import React, { useState, useEffect } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { User, Stats, Invoice } from '../../types';
import { fetchInvoices } from '../../services/api';
import { Camera, CheckCircle, Clock, FileText, ChevronRight, Gift, Trophy, ArrowUpRight, Sparkles, ShieldCheck, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';

const TIER_CONFIG: Record<string, { icon: string; color: string; bg: string; gradient: string; border: string; next: number | null; rewardPct: number }> = {
  Member:   { icon: '🪵', color: '#94A3B8', bg: '#F1F5F9', gradient: 'from-slate-700 to-slate-900', border: 'border-slate-400/40', next: 100, rewardPct: 0.8 },
  Bronze:   { icon: '🥉', color: '#D97706', bg: '#FEF3C7', gradient: 'from-amber-700 via-amber-800 to-amber-950', border: 'border-amber-400/50', next: 400, rewardPct: 1.0 },
  Silver:   { icon: '🥈', color: '#CBD5E1', bg: '#F8FAFC', gradient: 'from-slate-400 via-slate-600 to-slate-800', border: 'border-slate-300/60', next: 700, rewardPct: 1.5 },
  Gold:     { icon: '🥇', color: '#F59E0B', bg: '#FEF9C3', gradient: 'from-amber-400 via-yellow-500 to-amber-700', border: 'border-yellow-300/80', next: 1000, rewardPct: 2.0 },
  Platinum: { icon: '💎', color: '#A855F7', bg: '#F3E8FF', gradient: 'from-purple-500 via-indigo-600 to-slate-900', border: 'border-purple-300/70', next: null, rewardPct: 2.5 }
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
  const nextTierSheets = stats.nextTierSheets;
  const progressPct = nextTierSheets ? Math.min((totalSheets / nextTierSheets) * 100, 100) : 100;
  const nextMilestone = MILESTONES.find(m => totalSheets < m.sheets);

  const formatCardNumber = (id: string) => {
    const clean = id.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    return `PERILLO • ${clean.slice(0, 4)} • ${clean.slice(4, 8) || '2026'}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-xs';
      case 'Rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200 shadow-xs';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200 shadow-xs';
    }
  };

  return (
    <div className="space-y-6 pb-24 sm:pb-10 max-w-5xl mx-auto">
      {/* Welcome Bar with User Status Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/70 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1E4620] to-[#0f2e13] flex items-center justify-center text-white font-black text-xl shadow-md border border-emerald-500/30">
            {(user.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">{t('namaste')}</p>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{user.name || 'Carpenter Member'}</h2>
            <p className="text-xs text-slate-500 font-semibold">{user.phone ? `+91 ${user.phone}` : `ID: ${user.id}`}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {stats.verified ? (
            <div className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-xs">
              <ShieldCheck className="w-4 h-4 mr-1.5 text-emerald-700" />
              <span>Verified Account</span>
            </div>
          ) : (
            <div className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-xs">
              <Clock className="w-4 h-4 mr-1.5 text-amber-700" />
              <span>Verification Pending</span>
            </div>
          )}
        </div>
      </div>

      {/* Realistic VIP Smart Loyalty Card */}
      <div className="relative overflow-hidden rounded-3xl vip-card-mesh text-white p-6 sm:p-8 shadow-2xl border border-emerald-400/20 group">
        {/* Subtle holographic sheen overlay */}
        <div className="absolute inset-0 vip-card-sheen pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity duration-700" />

        <div className="relative z-10 flex flex-col justify-between min-h-[220px] sm:min-h-[240px]">
          {/* Card Top: Logo + EMV Chip + Tier Ribbon */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3.5">
              {/* EMV Chip */}
              <div className="emv-chip" title="Loyalty Smart Chip" />
              <div className="hidden sm:block">
                <div className="flex items-center space-x-1.5 text-emerald-300">
                  <CreditCard className="w-4 h-4 opacity-80" />
                  <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-200">Perillo Rewards Pass</span>
                </div>
                <span className="text-[10px] text-emerald-300/70 font-mono">SECURE WALLET</span>
              </div>
            </div>

            {/* Metallic Tier Badge */}
            <div className="flex items-center space-x-2 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/15 shadow-inner">
              <span className="text-xl">{tierCfg.icon}</span>
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

          {/* Card Middle: Points & Balance */}
          <div className="my-4 sm:my-6">
            <span className="text-[11px] font-extrabold tracking-widest text-emerald-300/90 uppercase block mb-1">
              {t('pointsBalance')}
            </span>
            <div className="flex items-baseline space-x-3">
              <h3 className="text-4xl sm:text-5xl font-black text-white tracking-tight drop-shadow-sm">
                {(stats.pointsBalance || 0).toLocaleString()}
              </h3>
              <span className="text-emerald-300 font-bold text-xl">{t('pts')}</span>
            </div>
            <div className="inline-flex items-center space-x-1.5 mt-1.5 bg-black/30 backdrop-blur-sm px-3 py-1 rounded-lg border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <p className="text-xs font-bold text-amber-300">
                {t('rupeeValue')} {(stats.pointsBalance || 0).toLocaleString()} INR
              </p>
            </div>
          </div>

          {/* Card Bottom: Number & Cardholder Name */}
          <div className="flex items-end justify-between border-t border-emerald-500/20 pt-3 text-xs sm:text-sm font-mono tracking-widest text-emerald-200/90">
            <div>
              <p className="text-[10px] text-emerald-400 font-sans tracking-normal uppercase font-bold">Cardholder</p>
              <p className="font-bold text-white font-sans uppercase text-xs sm:text-sm tracking-wide mt-0.5">{user.name || 'Member'}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-emerald-400 font-sans tracking-normal uppercase font-bold">Membership No</p>
              <p className="font-mono text-emerald-100 text-xs sm:text-sm font-semibold">{formatCardNumber(user.id)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tier Roadmap Progress Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">{t('loyaltyProgress')}</h3>
              <p className="text-xs text-slate-500 font-medium">Cumulative Plywood sheets purchase tracking</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-sm font-black text-[#1E4620]">
              {totalSheets} <span className="text-xs font-bold text-slate-500">{t('sheets')} {t('total')}</span>
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200 shadow-inner">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-sm"
          />
        </div>

        <div className="flex items-center justify-between text-xs font-bold pt-1">
          <span className="inline-flex items-center space-x-1.5 text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span>Current: {stats.tier} ({tierCfg.rewardPct}% Reward)</span>
          </span>
          <span className="text-slate-500">
            {stats.nextTier ? `${stats.nextTier} (${nextTierSheets} sheets target)` : t('maxTierReached')}
          </span>
        </div>

        {nextMilestone && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50/80 border border-amber-200/90 text-xs font-semibold text-amber-900 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Gift className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <span>
                {t('nextMilestoneGift')} <strong>{nextMilestone.sheets} {t('sheets')}</strong>: {nextMilestone.gift}
              </span>
            </div>
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-300/60">
              {nextMilestone.sheets - totalSheets} sheets left
            </span>
          </div>
        )}
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:border-amber-400/80 transition-all">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('pendingClaims')}</p>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <h4 className="text-2xl sm:text-3xl font-black text-amber-600 mt-2">{stats.pendingClaims}</h4>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Under admin verification</p>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:border-emerald-400/80 transition-all">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('approvedInvoices')}</p>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <h4 className="text-2xl sm:text-3xl font-black text-emerald-700 mt-2">{stats.approvedClaims}</h4>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Points credited to balance</p>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:border-sky-400/80 transition-all">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Plywood Sheets</p>
            <Trophy className="w-4 h-4 text-sky-600" />
          </div>
          <h4 className="text-2xl sm:text-3xl font-black text-slate-800 mt-2">{stats.totalSheets}</h4>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Lifetime verified sheets</p>
        </div>
      </div>

      {/* Recent Claims Section */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base sm:text-lg font-black text-[#1E4620] flex items-center space-x-2">
            <FileText className="w-5 h-5 text-emerald-800" />
            <span>{t('recentUploads')}</span>
          </h3>
          <button
            onClick={loadRecentClaims}
            className="text-xs text-slate-500 hover:text-emerald-800 font-bold flex items-center space-x-1 transition-colors"
          >
            <span>{t('pullRefresh')}</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs font-semibold">
            Loading recent invoices...
          </div>
        ) : recentClaims.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#1E4620] mx-auto flex items-center justify-center">
              <Camera className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">{t('noHistory')}</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">{t('uploadFirst')}</p>
            <button
              onClick={onNavigateUpload}
              className="px-5 py-2.5 bg-[#1E4620] hover:bg-[#153417] text-white font-bold text-xs rounded-xl shadow-md transition-transform active:scale-95"
            >
              {t('uploadInvoice')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {recentClaims.map((item) => (
              <div
                key={item.id}
                onClick={() => onViewLedgerItem(item)}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:shadow-md hover:border-emerald-600/40 transition-all cursor-pointer flex items-center justify-between group press-scale"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-800 transition-colors flex-shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-900 transition-colors line-clamp-1">
                      {item.store_name || item.dealer_name || 'Plywood Store'}
                    </h4>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                      {item.product_type || 'Plywood'} • {item.quantity} Sheets
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Inv #{item.invoice_number} · {item.purchase_date}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-1.5 flex-shrink-0">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getStatusBadge(item.status)}`}>
                    {item.status}
                  </span>
                  {item.status === 'Approved' && (
                    <span className="text-xs font-black text-emerald-800">
                      +{item.points_earned} Pts
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-700 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button for Upload */}
      <button
        onClick={onNavigateUpload}
        className="fixed bottom-20 right-4 sm:bottom-8 sm:right-8 z-30 bg-gradient-to-r from-[#D97706] to-[#B45309] hover:from-[#B45309] hover:to-[#92400E] text-white font-black px-6 py-4 rounded-2xl shadow-2xl hover:shadow-amber-500/30 transition-all active:scale-95 flex items-center space-x-2.5 border border-amber-300/40"
      >
        <Camera className="w-5 h-5 text-amber-100" />
        <span className="text-xs sm:text-sm tracking-wider uppercase">{t('uploadInvoice')}</span>
      </button>
    </div>
  );
};
