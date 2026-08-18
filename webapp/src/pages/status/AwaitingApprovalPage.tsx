import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { Clock, RefreshCw, LogOut, CheckCircle, ShieldAlert } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl sm:px-10 border border-slate-200 text-center">
          <div className="w-20 h-20 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <Clock className="w-10 h-10 animate-pulse" />
          </div>

          <h2 className="text-2xl font-black text-slate-800">{t('pendingApprovalTitle')}</h2>
          <p className="text-sm font-medium text-slate-600 mt-2 leading-relaxed">
            {t('pendingApprovalMsg')}
          </p>

          {message && (
            <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800">
              {message}
            </div>
          )}

          <div className="my-6 border-t border-slate-200" />

          <div className="text-left bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 mb-6">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              {t('submittedDetails')}
            </h4>
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-500">{t('fullName')}:</span>
              <span className="text-slate-900">{user?.name || '-'}</span>
            </div>
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-500">{t('mobile')}:</span>
              <span className="text-slate-900">+91 {user?.phone || '-'}</span>
            </div>
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-500">{t('aadhaar')}:</span>
              <span className="text-slate-900">{maskAadhaar(user?.aadhaar_number)}</span>
            </div>
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-500">{t('region')}:</span>
              <span className="text-slate-900">
                {user?.city && user?.state ? `${user.city}, ${user.state}` : user?.city || user?.state || '-'}
              </span>
            </div>
          </div>

          <button
            onClick={handleRefreshStatus}
            disabled={refreshing}
            className="w-full py-3 px-4 bg-[#1E4620] hover:bg-[#163318] text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-[0.99] disabled:opacity-70 flex items-center justify-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{t('refreshStatus')}</span>
          </button>

          <button
            onClick={logout}
            className="mt-4 inline-flex items-center text-xs font-bold text-rose-600 hover:underline"
          >
            <LogOut className="w-3.5 h-3.5 mr-1" />
            <span>{t('logout')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
