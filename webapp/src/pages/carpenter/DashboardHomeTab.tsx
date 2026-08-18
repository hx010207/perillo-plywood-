import React, { useState, useEffect } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { User, Stats, Invoice } from '../../types';
import { fetchInvoices } from '../../services/api';
import { Camera, CheckCircle2, Clock, FileText, ChevronRight, Gift, Trophy, ShieldCheck, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { PerilloRewardsCard } from '../../components/common/PerilloRewardsCard';
import { CountUp } from '../../components/reactbits/CountUp';
import { Magnet } from '../../components/reactbits/Magnet';

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

  const totalSheets = stats.totalSheets || 0;
  const nextTierSheets = stats.nextTierSheets || 100;
  const progressPct = nextTierSheets ? Math.min((totalSheets / nextTierSheets) * 100, 100) : 100;
  const nextMilestone = MILESTONES.find(m => totalSheets < m.sheets) || MILESTONES[0];
  const sheetsLeft = Math.max(0, nextMilestone.sheets - totalSheets);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-400/40';
      case 'Rejected':
        return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-400/40';
      default:
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-400/40';
    }
  };

  return (
    <div className="space-y-6 pb-28 sm:pb-12 max-w-4xl mx-auto">
      {/* 1. User Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#121A15]/85 backdrop-blur-xl border border-emerald-950/10 dark:border-white/10 shadow-sm dark:shadow-xl transition-colors duration-200"
      >
        <div className="flex items-center space-x-4">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#1E4620] to-[#0A160D] flex items-center justify-center text-white font-extrabold text-xl shadow-md border border-emerald-500/30">
            {(user.name || 'R').charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest block">
              NAMASTE 🙏
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
              {user.name || 'Raju Carpenter'}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              {user.phone ? `+91 ${user.phone}` : `User ID: ${user.id}`}
            </p>
          </div>
        </div>

        <div className="self-start sm:self-auto">
          {stats.verified ? (
            <div className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-400/40 shadow-glow-emerald">
              <ShieldCheck className="w-4 h-4 mr-1.5 text-emerald-600 dark:text-emerald-400" />
              <span>Verified Account</span>
            </div>
          ) : (
            <div className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-400/30">
              <Clock className="w-4 h-4 mr-1.5 text-amber-600 dark:text-amber-400" />
              <span>Verification Pending</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* 2. 3D Holographic "Perillo Rewards Pass" (Dynamic 4-Tier Switcher with EMV Chip offset) */}
      <PerilloRewardsCard
        userName={user.name}
        userId={user.id}
        pointsBalance={stats.pointsBalance}
        tier={stats.tier}
        tierRewardPct={stats.tierRewardPct}
      />

      {/* 3. Loyalty Progress Tracker */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#121A15]/85 backdrop-blur-xl border border-emerald-950/10 dark:border-white/10 shadow-sm dark:shadow-xl space-y-4 transition-colors duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                {t('loyaltyProgress')}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">Cumulative verified plywood sheets</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-sm font-extrabold text-amber-600 dark:text-amber-300">
              {totalSheets} / {nextTierSheets} Sheets
            </span>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="w-full h-3 bg-slate-200 dark:bg-black/60 rounded-full overflow-hidden p-0.5 border border-slate-300 dark:border-white/10 shadow-inner">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-amber-500"
          />
        </div>

        {/* Milestone Banner */}
        {nextMilestone && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-400/30 text-xs font-semibold text-amber-900 dark:text-amber-200 flex items-center justify-between shadow-glow-amber">
            <div className="flex items-center space-x-2.5">
              <Gift className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 animate-pulse" />
              <span>
                🎁 Next gift at <strong>{nextMilestone.sheets} Sheets</strong>: {nextMilestone.gift}
              </span>
            </div>
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-400/30">
              {sheetsLeft} SHEETS LEFT
            </span>
          </div>
        )}
      </div>

      {/* 4. Restyled KPI Triad (Pending, Approved, Total Sheets) */}
      <div className="grid grid-cols-3 gap-3.5 sm:gap-4">
        {/* Pending Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#121A15]/85 backdrop-blur-xl border border-emerald-950/10 dark:border-white/10 shadow-sm dark:shadow-xl transition-all hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              PENDING
            </span>
            <Clock className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <h4 className="text-2xl sm:text-3xl font-extrabold text-[#F59E0B] mt-2">
            <CountUp to={stats.pendingClaims} />
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Under Verification</p>
        </div>

        {/* Approved Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#121A15]/85 backdrop-blur-xl border border-emerald-950/10 dark:border-white/10 shadow-sm dark:shadow-xl transition-all hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              APPROVED
            </span>
            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
          </div>
          <h4 className="text-2xl sm:text-3xl font-extrabold text-[#10B981] mt-2">
            <CountUp to={stats.approvedClaims} />
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Points Credited</p>
        </div>

        {/* Total Sheets Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#121A15]/85 backdrop-blur-xl border border-emerald-950/10 dark:border-white/10 shadow-sm dark:shadow-xl transition-all hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              TOTAL SHEETS
            </span>
            <Trophy className="w-4 h-4 text-sky-500 dark:text-sky-400" />
          </div>
          <h4 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-[#FFFFFF] mt-2">
            <CountUp to={stats.totalSheets || 0} />
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Lifetime Verified</p>
        </div>
      </div>

      {/* 5. Recent Uploads Grid */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="section-heading flex items-center space-x-2">
            <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{t('recentUploads')}</span>
          </h3>
          <button
            onClick={loadRecentClaims}
            className="text-xs font-bold text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 flex items-center space-x-1 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('pullRefresh')}</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 bg-white/60 dark:bg-[#121A15]/60 rounded-2xl border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 text-xs">
            Loading recent invoices...
          </div>
        ) : recentClaims.length === 0 ? (
          <div className="p-8 text-center space-y-3 rounded-2xl bg-white dark:bg-[#121A15]/85 backdrop-blur-xl border border-emerald-950/10 dark:border-white/10 shadow-sm dark:shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <Camera className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{t('noHistory')}</h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xs mx-auto leading-relaxed">{t('uploadFirst')}</p>
            <button
              onClick={onNavigateUpload}
              className="btn-primary-amber px-6 py-2.5 text-xs uppercase tracking-wider font-bold"
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
                className="p-5 rounded-2xl bg-white dark:bg-[#121A15]/85 backdrop-blur-xl border border-emerald-950/10 dark:border-white/10 shadow-sm dark:shadow-xl cursor-pointer group press-scale hover:border-emerald-500/40 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex-shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors line-clamp-1">
                        {item.store_name || item.dealer_name || 'Dealer Store'}
                      </h4>
                      <p className="text-xs text-amber-700 dark:text-amber-300 font-medium mt-0.5">
                        {item.dealer_city ? `${item.dealer_city} • ` : ''}{item.product_type} ({item.quantity} Sheets)
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Inv #{item.invoice_number} · {item.purchase_date}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-1.5 flex-shrink-0">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(item.status)}`}>
                      {item.status === 'Approved' ? `APPROVED +${item.points_earned} Pts` : item.status}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. Global Sticky Action Button with ReactBits Magnet physics */}
      <div className="fixed bottom-20 right-4 sm:bottom-8 sm:right-8 z-30">
        <Magnet strength={0.25}>
          <button
            onClick={onNavigateUpload}
            className="btn-primary-amber px-6 py-4 rounded-xl flex items-center space-x-2.5 uppercase text-xs sm:text-sm tracking-wider font-extrabold"
          >
            <Camera className="w-5 h-5 text-amber-100" />
            <span>{t('uploadInvoice')}</span>
          </button>
        </Magnet>
      </div>
    </div>
  );
};
