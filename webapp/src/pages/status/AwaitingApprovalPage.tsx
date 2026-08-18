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
    <div className="relative w-full min-h-screen selection:bg-[#8C6D58] selection:text-white">
      {/* Fixed Backdrop GradientWaves (Warm Linen / Beige) */}
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none overflow-hidden">
        <GradientWaves
          horizonColor="#FAF7F2"
          waveColor="#D9C5B2"
          crestColor="#8C6D58"
          brightness={1.1}
          opacity={0.9}
          speed={0.35}
        />
      </div>

      <main className="relative z-10 w-full min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-[#2A1E17] dark:text-[#FAF7F2]">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="relative rounded-3xl bg-[#FAF7F2]/90 dark:bg-[#261C16]/90 py-8 px-6 shadow-lg shadow-stone-900/5 rounded-3xl sm:px-10 border border-[#8C6D58]/20 text-center backdrop-blur-md before:absolute before:inset-2 before:border before:border-dashed before:border-[#8C6D58]/30 dark:before:border-[#D9C5B2]/20 before:pointer-events-none before:rounded-2xl">
            <div className="relative z-10">
              <div className="w-20 h-20 rounded-full bg-[#8C6D58]/15 text-[#8C6D58] flex items-center justify-center mx-auto mb-4 border-2 border-white ring-2 ring-[#8C6D58]/40 shadow-md">
                <Clock className="w-10 h-10 animate-pulse" />
              </div>

              <h2 className="text-2xl font-black text-[#2A1E17] dark:text-[#FAF7F2]">{t('pendingApprovalTitle')}</h2>
              <p className="text-sm font-semibold text-[#6B5A4E] dark:text-[#C4B5A5] mt-2 leading-relaxed">
                {t('pendingApprovalMsg')}
              </p>

              {message && (
                <div className="mt-4 p-3 rounded-xl bg-amber-500/15 border border-amber-400/40 text-xs font-bold text-amber-900 dark:text-amber-300">
                  {message}
                </div>
              )}

              <div className="my-6 border-t border-[#8C6D58]/15 dark:border-white/10" />

              <div className="text-left bg-white/80 dark:bg-[#1E1612] rounded-2xl p-4 border border-[#8C6D58]/20 space-y-2 mb-6">
                <h4 className="text-xs font-black text-[#6B5A4E] dark:text-stone-400 uppercase tracking-wider mb-2">
                  {t('submittedDetails')}
                </h4>
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[#6B5A4E] dark:text-stone-400">{t('fullName')}:</span>
                  <span className="text-[#2A1E17] dark:text-white font-bold">{user?.name || '-'}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[#6B5A4E] dark:text-stone-400">{t('mobile')}:</span>
                  <span className="text-[#2A1E17] dark:text-white font-bold">+91 {user?.phone || '-'}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[#6B5A4E] dark:text-stone-400">{t('aadhaar')}:</span>
                  <span className="text-[#8C6D58] dark:text-[#D9C5B2] font-bold">{maskAadhaar(user?.aadhaar_number)}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[#6B5A4E] dark:text-stone-400">{t('region')}:</span>
                  <span className="text-[#2A1E17] dark:text-white font-semibold">
                    {user?.city && user?.state ? `${user.city}, ${user.state}` : user?.city || user?.state || '-'}
                  </span>
                </div>
              </div>

              <button
                onClick={handleRefreshStatus}
                disabled={refreshing}
                className="btn-primary-timber w-full py-3.5 px-4 text-sm font-black rounded-xl shadow-md transition-all active:scale-[0.99] disabled:opacity-70 flex items-center justify-center space-x-2 border-2 border-white/40"
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
      </main>
    </div>
  );
};
