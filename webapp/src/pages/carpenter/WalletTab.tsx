import React, { useState, useEffect } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { User, Stats, Payout } from '../../types';
import { fetchPayouts, requestPayout } from '../../services/api';
import { Wallet, RefreshCw, Zap, Landmark, CheckCircle2, AlertCircle, ArrowUpRight, ShieldCheck, Sparkles, IndianRupee } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

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

  return (
    <div className="space-y-6 pb-24 sm:pb-10 max-w-4xl mx-auto">
      {/* Wallet Balance Hero Card */}
      <div className="relative overflow-hidden rounded-3xl vip-card-mesh p-6 sm:p-8 text-white shadow-2xl border border-emerald-400/20 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-black uppercase tracking-widest text-emerald-300">
              {t('availableBalance')}
            </span>
            <div className="flex items-baseline space-x-2.5 mt-1">
              <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                {currentBalance.toLocaleString()}
              </h2>
              <span className="text-emerald-300 text-2xl font-bold">Pts</span>
            </div>
            <div className="inline-flex items-center space-x-1.5 mt-2 bg-black/30 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <p className="text-xs font-bold text-amber-300">
                {t('equivalentTo')} ₹{currentBalance.toLocaleString()} (1 Pt = ₹1)
              </p>
            </div>
          </div>

          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-emerald-300">
            <Wallet className="w-7 h-7" />
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={handleRedeemClick}
            disabled={currentBalance <= 0}
            className="w-full py-4 px-6 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl hover:shadow-amber-500/20 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <Zap className="w-4 h-4 text-slate-950 fill-current" />
            <span>{t('redeemBtn')}</span>
          </button>
          <p className="text-[11px] text-emerald-200/80 font-semibold text-center mt-2.5">
            🔒 {t('payoutReviewNote')}
          </p>
        </div>
      </div>

      {/* History Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-base sm:text-lg font-black text-[#1E4620]">{t('payoutHistory')}</h3>
          <p className="text-xs text-slate-500 font-medium">All past redemption requests & bank transfers</p>
        </div>
        <button
          onClick={() => { loadPayouts(); onRefreshStats(); }}
          className="flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-emerald-800 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{t('pullRefresh')}</span>
        </button>
      </div>

      {/* Payout History List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs font-semibold bg-white rounded-2xl border border-slate-200">
          Loading payout history...
        </div>
      ) : payouts.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
            <Wallet className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">{t('noRedemptionHistory')}</h4>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">{t('noRedemptionSubText')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payouts.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex items-center justify-between group hover:border-emerald-500/40 transition-all"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 flex-shrink-0">
                  {item.payout_type === 'UPI' ? <Zap className="w-6 h-6 text-amber-600" /> : <Landmark className="w-6 h-6 text-sky-700" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {t('redeemedVia')} {item.payout_type} — ₹{item.amount}
                  </h4>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    {item.points_redeemed || item.amount} Points Redeemed
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    ID: {item.id} · {(item.created_at || '').split('T')[0]}
                  </p>
                </div>
              </div>

              <Badge status={item.status} />
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
        <form onSubmit={submitRedeem} className="space-y-5">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">{t('availableBalance')}</p>
              <p className="text-2xl font-black text-[#1E4620]">{currentBalance.toLocaleString()} Pts</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold text-slate-500 uppercase">After Payout</p>
              <p className="text-lg font-bold text-slate-700">{remainingBalance.toLocaleString()} Pts</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1.5">
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
                className="w-full px-4 py-3 border border-slate-300 rounded-xl font-black text-xl text-slate-900 focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-400 uppercase">
                = ₹{pointsNum || 0} INR
              </span>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex items-center gap-2 mt-2">
              {[500, 1000, 2000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handlePresetSelect(amt)}
                  disabled={amt > currentBalance}
                  className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ₹{amt}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handlePresetSelect(currentBalance)}
                className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors"
              >
                Max All (₹{currentBalance})
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-2">
              {t('choosePayoutMode')}
            </label>
            <div className="space-y-2">
              {user.upi_id && (
                <button
                  type="button"
                  onClick={() => setRedeemType('UPI')}
                  className={`w-full p-3.5 rounded-2xl border-2 flex items-center justify-between text-left font-bold text-xs transition-all ${
                    redeemType === 'UPI'
                      ? 'bg-emerald-50/80 border-emerald-600 text-[#1E4620] shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900">Instant UPI Transfer</p>
                      <p className="text-xs text-slate-500 font-mono">{user.upi_id}</p>
                    </div>
                  </div>
                  {redeemType === 'UPI' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                </button>
              )}

              {user.account_number && (
                <button
                  type="button"
                  onClick={() => setRedeemType('Bank')}
                  className={`w-full p-3.5 rounded-2xl border-2 flex items-center justify-between text-left font-bold text-xs transition-all ${
                    redeemType === 'Bank'
                      ? 'bg-emerald-50/80 border-emerald-600 text-[#1E4620] shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center text-sky-700">
                      <Landmark className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900">{user.bank_name || 'Bank Transfer'}</p>
                      <p className="text-xs text-slate-500 font-mono">A/C: ••••{(user.account_number || '').slice(-4)}</p>
                    </div>
                  </div>
                  {redeemType === 'Bank' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                </button>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={redeeming || pointsNum <= 0 || pointsNum > currentBalance}
            className="w-full py-4 bg-[#1E4620] hover:bg-[#153417] text-white font-black text-sm rounded-2xl shadow-lg transition-all active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
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
        <div className="space-y-4">
          <p className="text-sm font-semibold text-slate-700 leading-relaxed">{alertState.message}</p>
          <div className="flex justify-end pt-2">
            <button
              onClick={() => setAlertState({ ...alertState, isOpen: false })}
              className="px-6 py-2.5 bg-[#1E4620] text-white font-bold text-xs rounded-xl shadow-md transition-transform active:scale-95"
            >
              {t('ok')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
