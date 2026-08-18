import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { Clock, RefreshCw, LogOut } from 'lucide-react';
import { GradientWaves } from '../../components/reactbits/GradientWaves';

export const AwaitingApprovalPage: React.FC = () => {
  const { t } = useI18n();
  const { user, refreshProfile, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');

  const handleRefreshStatus = async () => {
    setRefreshing(true);
    setMessage('');
    try {
      const nextUser = await refreshProfile();
      if (nextUser) {
        if (nextUser.status === 'approved') {
          setMessage(t('accountApprovedMsg'));
        } else {
          setMessage(t('statusStillReview'));
        }
      } else {
        setMessage(t('statusCheckFailed'));
      }
    } catch (error) {
      setMessage('Failed to refresh status. Check connection.');
    } finally {
      setRefreshing(false);
    }
  };

  const maskAadhaar = (val?: string) => {
    if (!val || val.length < 4) return val || '-';
    return '•••• •••• ' + val.slice(-4);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative text-slate-900 dark:text-white">
      {/* ReactBits GradientWaves */}
      <GradientWaves
        horizonColor="#E2E8F0"
        waveColor="#10B981"
        crestColor="#34D399"
        speed={0.3}
        amplitude={2.0}
        opacity={0.6}
        grain={true}
        grainIntensity={0.03}
      />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="relative rounded-3xl bg-white/90 dark:bg-[#121A15]/90 py-8 px-6 shadow-2xl rounded-3xl sm:px-10 border border-[#10B981]/40 text-center backdrop-blur-xl before:absolute before:inset-2 before:border before:border-dashed before:border-white/80 dark:before:border-white/20 before:pointer-events-none before:rounded-2xl">
          <div className="relative z-10">
            <div className="w-20 h-20 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4 border-2 border-white ring-2 ring-amber-400/40 shadow-md">
              <Clock className="w-10 h-10 animate-pulse" />
            </div>

            <h2 className="text-2xl font-black text-slate-900 dark:text-white">{t('pendingApprovalTitle')}</h2>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              {t('pendingApprovalMsg')}
            </p>

            {message && (
              <div className="mt-4 p-3 rounded-xl bg-amber-500/15 border border-amber-400/40 text-xs font-bold text-amber-800 dark:text-amber-300">
                {message}
              </div>
            )}

            <div className="my-6 border-t border-[#10B981]/20" />

            <div className="text-left bg-slate-50/90 dark:bg-[#0B130E] rounded-2xl p-4 border border-[#10B981]/30 space-y-2 mb-6">
              <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                {t('submittedDetails')}
              </h4>
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-500 dark:text-slate-400">{t('fullName')}:</span>
                <span className="text-slate-900 dark:text-white font-bold">{user?.name || '-'}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-500 dark:text-slate-400">{t('mobile')}:</span>
                <span className="text-slate-900 dark:text-white font-bold">+91 {user?.phone || '-'}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-500 dark:text-slate-400">{t('aadhaar')}:</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">{maskAadhaar(user?.aadhaar_number)}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-500 dark:text-slate-400">{t('region')}:</span>
                <span className="text-slate-900 dark:text-white font-semibold">
                  {user?.city && user?.state ? `${user.city}, ${user.state}` : user?.city || user?.state || '-'}
                </span>
              </div>
            </div>

            <button
              onClick={handleRefreshStatus}
              disabled={refreshing}
              className="w-full py-3.5 px-4 bg-[#1E4620] hover:bg-[#163318] text-white font-black text-sm rounded-xl shadow-md transition-all active:scale-[0.99] disabled:opacity-70 flex items-center justify-center space-x-2 border-2 border-white/40"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{t('refreshStatus')}</span>
            </button>

            <button
              onClick={logout}
              className="mt-4 inline-flex items-center text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline"
            >
              <LogOut className="w-3.5 h-3.5 mr-1" />
              <span>{t('logout')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
