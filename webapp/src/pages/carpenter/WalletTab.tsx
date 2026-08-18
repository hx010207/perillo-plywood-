import React, { useState, useEffect } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { User, Stats, Payout } from '../../types';
import { fetchPayouts, requestPayout } from '../../services/api';
import { Wallet, RefreshCw, Zap, Landmark, CheckCircle2, Sparkles } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { CountUp } from '../../components/reactbits/CountUp';

interface WalletTabProps {
  user: User;
  stats: Stats;
  onRefreshStats: () => void;
}

export const WalletTab: React.FC<WalletTabProps> = ({ user, stats, onRefreshStats }) => {
  const { t } = useI18n();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [redeemPoints, setRedeemPoints] = useState('');
  const [redeemType, setRedeemType] = useState<'UPI' | 'Bank'>('UPI');
  const [redeeming, setRedeeming] = useState(false);

  const [alertState, setAlertState] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false,
    title: '',
    message: '',
  });

  const loadPayouts = async () => {
    try {
      const data = await fetchPayouts(user.id);
      setPayouts(data);
    } catch (err) {
      console.warn('Error fetching payouts:', err);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadPayouts().finally(() => setLoading(false));
  }, [user.id]);

  const handleRedeemClick = () => {
    const hasUpi = Boolean(user.upi_id);
    const hasBank = Boolean(user.bank_name && user.account_number && user.ifsc_code);

    if (!hasUpi && !hasBank) {
      setAlertState({
        isOpen: true,
        title: t('missingPaymentProfile'),
        message: t('missingPaymentMsg'),
      });
      return;
    }

    if (hasUpi) setRedeemType('UPI');
    else setRedeemType('Bank');

    setRedeemPoints('');
    setModalVisible(true);
  };

  const pointsNum = parseInt(redeemPoints, 10) || 0;
  const currentBalance = stats.pointsBalance || 0;
  const remainingBalance = Math.max(0, currentBalance - pointsNum);

  const handlePresetSelect = (amount: number) => {
    const validAmount = Math.min(amount, currentBalance);
    setRedeemPoints(String(validAmount));
  };

  const submitRedeem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isNaN(pointsNum) || pointsNum <= 0) {
      setAlertState({ isOpen: true, title: t('invalidAmount'), message: t('invalidAmountMsg') });
      return;
    }
    if (pointsNum > currentBalance) {
      setAlertState({ isOpen: true, title: t('insufficientBalance'), message: t('insufficientMsg') });
      return;
    }
    if (redeemType === 'UPI' && !user.upi_id) {
      setAlertState({ isOpen: true, title: t('missingUPI'), message: t('missingUPIMsg') });
      return;
    }
    if (redeemType === 'Bank' && (!user.bank_name || !user.account_number || !user.ifsc_code)) {
      setAlertState({ isOpen: true, title: t('missingBank'), message: t('missingBankMsg') });
      return;
    }

    setRedeeming(true);
    try {
      const data = await requestPayout(user.id, pointsNum, redeemType);
      if (data.success) {
        setModalVisible(false);
        setAlertState({
          isOpen: true,
          title: t('requestSubmitted'),
          message: `${t('payoutRequestFor')} ₹${pointsNum} ${t('submittedSoon')}`,
        });
        loadPayouts();
        onRefreshStats();
      } else {
        setAlertState({
          isOpen: true,
          title: t('redeemFailed'),
          message: data.error || t('somethingWentWrong'),
        });
      }
    } catch (err: any) {
      console.error('Redeem error:', err);
      setAlertState({
        isOpen: true,
        title: t('error'),
        message: err?.response?.data?.error || t('connectionFailure'),
      });
    } finally {
      setRedeeming(false);
    }
  };

  const getPayoutBadge = (status: string) => {
    switch (status) {
      case 'Approved':
      case 'Completed':
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-400/40';
      case 'Rejected':
        return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-400/40';
      default:
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-400/40';
    }
  };

  return (
    <div className="space-y-6 pb-28 sm:pb-12 max-w-4xl mx-auto text-slate-900 dark:text-white">
      {/* 1. Digital Wallet Hero Card (Thin Green Box with White Dotted Line) */}
      <div className="relative rounded-2xl bg-white/90 dark:bg-[#121A15]/90 backdrop-blur-xl border border-[#10B981]/40 p-6 sm:p-8 shadow-xl shadow-emerald-900/5 space-y-6 transition-all duration-300 before:absolute before:inset-2 before:border before:border-dashed before:border-white/80 dark:before:border-white/20 before:pointer-events-none before:rounded-xl">
        <div className="relative z-10 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                {t('availableBalance')}
              </span>
              <div className="flex items-baseline space-x-3 mt-1">
                <h2 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                  <CountUp to={currentBalance} duration={1.6} />
                </h2>
                <span className="text-emerald-600 dark:text-emerald-400 text-2xl font-black">Pts</span>
              </div>
              <div className="inline-flex items-center space-x-2 mt-2 bg-slate-100/80 dark:bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-[#10B981]/30">
                <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                  {t('equivalentTo')} ₹{currentBalance.toLocaleString()} INR (1 Pt = ₹1)
                </p>
              </div>
            </div>

            <div className="w-14 h-14 rounded-full bg-emerald-500/15 border-2 border-white ring-2 ring-[#10B981]/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-md">
              <Wallet className="w-7 h-7" />
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleRedeemClick}
              disabled={currentBalance <= 0}
              className="btn-primary-amber w-full py-4 uppercase text-sm tracking-wider font-black flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-white/40"
            >
              <Zap className="w-5 h-5 fill-current text-white" />
              <span>⚡ {t('redeemBtn')}</span>
            </button>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 text-center mt-3">
              🔒 Direct IMPS & UPI Disbursals processed within minutes
            </p>
          </div>
        </div>
      </div>

      {/* 2. History Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="section-heading">{t('payoutHistory')}</h3>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-0.5">All past redemption requests & bank transfers</p>
        </div>
        <button
          onClick={() => { loadPayouts(); onRefreshStats(); }}
          className="flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{t('pullRefresh')}</span>
        </button>
      </div>

      {/* 3. Payout History List */}
      {loading ? (
        <div className="text-center py-16 text-slate-500 dark:text-slate-400 text-xs font-semibold bg-white/80 dark:bg-[#121A15]/60 rounded-2xl border border-[#10B981]/30">
          Loading payout history...
        </div>
      ) : payouts.length === 0 ? (
        <div className="relative rounded-2xl bg-white/90 dark:bg-[#121A15]/90 backdrop-blur-xl border border-[#10B981]/40 p-12 text-center space-y-3 shadow-xl shadow-emerald-900/5 before:absolute before:inset-2 before:border before:border-dashed before:border-white/80 dark:before:border-white/20 before:pointer-events-none before:rounded-xl">
          <div className="relative z-10 space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-white/5 border border-emerald-500/30 flex items-center justify-center text-slate-400 dark:text-slate-500 mx-auto">
              <Wallet className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black text-slate-900 dark:text-white">{t('noRedemptionHistory')}</h4>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 max-w-xs mx-auto leading-relaxed">{t('noRedemptionSubText')}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {payouts.map((item) => (
            <div
              key={item.id}
              className="relative rounded-2xl bg-white/90 dark:bg-[#121A15]/90 backdrop-blur-xl border border-[#10B981]/40 p-5 shadow-xl shadow-emerald-900/5 before:absolute before:inset-1.5 before:border before:border-dashed before:border-white/80 dark:before:border-white/20 before:pointer-events-none before:rounded-xl"
            >
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center space-x-3.5">
                  <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-white/5 border border-[#10B981]/30 flex items-center justify-center text-slate-600 dark:text-slate-300 flex-shrink-0">
                    {item.payout_type === 'UPI' ? <Zap className="w-5 h-5 text-amber-500 dark:text-amber-400" /> : <Landmark className="w-5 h-5 text-sky-600 dark:text-sky-400" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      {t('redeemedVia')} {item.payout_type} — ₹{item.amount} INR
                    </h4>
                    <p className="text-xs text-amber-700 dark:text-amber-300 font-bold mt-0.5">
                      {item.points_redeemed || item.amount} Points Redeemed
                    </p>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                      ID: {item.id} · {(item.created_at || '').split('T')[0]}
                    </p>
                  </div>
                </div>

                <span className={`px-3 py-1 rounded-xl text-xs font-extrabold uppercase tracking-wider border ${getPayoutBadge(item.status)}`}>
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Redeem Modal */}
      <Modal
        isOpen={modalVisible}
        onClose={() => setModalVisible(false)}
        title={t('redeemPoints')}
      >
        <form onSubmit={submitRedeem} className="space-y-5 text-slate-900 dark:text-white">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0B130E] border border-[#10B981]/30 flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase">{t('availableBalance')}</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{currentBalance.toLocaleString()} Pts</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">After Payout</p>
              <p className="text-lg font-black text-amber-600 dark:text-amber-300">{remainingBalance.toLocaleString()} Pts</p>
            </div>
          </div>

          <div>
            <label className="form-label">
              {t('enterPoints')}
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max={currentBalance}
                required
                value={redeemPoints}
                onChange={(e) => setRedeemPoints(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="e.g. 500"
                className="form-input-field text-lg font-black"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-extrabold text-amber-600 dark:text-amber-400 uppercase">
                = ₹{pointsNum || 0} INR
              </span>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex items-center gap-2 mt-2.5">
              {[500, 1000, 2000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handlePresetSelect(amt)}
                  disabled={amt > currentBalance}
                  className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 disabled:opacity-40 transition-colors"
                >
                  ₹{amt}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handlePresetSelect(currentBalance)}
                className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-400/40 transition-colors"
              >
                Max (₹{currentBalance})
              </button>
            </div>
          </div>

          <div>
            <label className="form-label">
              {t('choosePayoutMode')}
            </label>
            <div className="space-y-2">
              {user.upi_id && (
                <button
                  type="button"
                  onClick={() => setRedeemType('UPI')}
                  className={`w-full p-3.5 rounded-xl border-2 flex items-center justify-between text-left font-bold text-xs transition-all ${
                    redeemType === 'UPI'
                      ? 'bg-emerald-500/15 border-emerald-600 dark:border-emerald-400 text-slate-900 dark:text-white shadow-sm ring-2 ring-emerald-500/20'
                      : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-black text-slate-900 dark:text-white">Instant UPI Transfer</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-300 font-semibold">{user.upi_id}</p>
                    </div>
                  </div>
                  {redeemType === 'UPI' && <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
                </button>
              )}

              {user.account_number && (
                <button
                  type="button"
                  onClick={() => setRedeemType('Bank')}
                  className={`w-full p-3.5 rounded-xl border-2 flex items-center justify-between text-left font-bold text-xs transition-all ${
                    redeemType === 'Bank'
                      ? 'bg-emerald-500/15 border-emerald-600 dark:border-emerald-400 text-slate-900 dark:text-white shadow-sm ring-2 ring-emerald-500/20'
                      : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
                      <Landmark className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-black text-slate-900 dark:text-white">{user.bank_name || 'Bank IMPS'}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">A/C: ••••{(user.account_number || '').slice(-4)}</p>
                    </div>
                  </div>
                  {redeemType === 'Bank' && <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
                </button>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={redeeming || pointsNum <= 0 || pointsNum > currentBalance}
            className="btn-primary-amber w-full py-4 uppercase text-sm tracking-wider font-black disabled:opacity-60 border-2 border-white/40"
          >
            {redeeming ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
            ) : (
              <span>{t('confirmRedemption')}</span>
            )}
          </button>
        </form>
      </Modal>

      {/* Alert Modal */}
      <Modal
        isOpen={alertState.isOpen}
        onClose={() => setAlertState({ ...alertState, isOpen: false })}
        title={alertState.title}
      >
        <div className="space-y-4 text-slate-700 dark:text-slate-200">
          <p className="text-sm font-semibold leading-relaxed">{alertState.message}</p>
          <div className="flex justify-end pt-2">
            <button
              onClick={() => setAlertState({ ...alertState, isOpen: false })}
              className="px-6 py-2.5 bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-bold text-xs rounded-xl shadow-md transition-transform active:scale-95"
            >
              {t('ok')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
