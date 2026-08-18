import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { XCircle, LogOut, PhoneCall, Mail } from 'lucide-react';
import { AuroraBackground } from '../../components/reactbits/AuroraBackground';

export const RejectedPage: React.FC = () => {
  const { t } = useI18n();
  const { logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative text-slate-900 dark:text-white">
      <AuroraBackground />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white dark:bg-[#121A15]/90 py-8 px-6 shadow-xl dark:shadow-2xl rounded-3xl sm:px-10 border border-rose-200 dark:border-rose-900/30 text-center backdrop-blur-xl">
          <div className="w-20 h-20 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-400/30">
            <XCircle className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-extrabold text-rose-700 dark:text-rose-300">{t('rejectedTitle')}</h2>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
            {t('rejectedMsg')}
          </p>

          <div className="my-6 border-t border-slate-100 dark:border-white/10" />

          <div className="text-left bg-slate-50 dark:bg-[#0B130E] rounded-2xl p-4 border border-slate-200 dark:border-white/10 space-y-2 mb-6">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Support Desk
            </h4>
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Email: support@perilloplywood.in</span>
            </div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <PhoneCall className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Helpline: +91 1800 200 9988</span>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full py-3.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center space-x-2"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('logout')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
