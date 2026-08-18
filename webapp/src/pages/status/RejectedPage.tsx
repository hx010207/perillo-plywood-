import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { XCircle, LogOut, PhoneCall, Mail } from 'lucide-react';
import { GradientWaves } from '../../components/reactbits/GradientWaves';

export const RejectedPage: React.FC = () => {
  const { t } = useI18n();
  const { logout } = useAuth();

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
        <div className="relative rounded-3xl bg-white/90 dark:bg-[#121A15]/90 py-8 px-6 shadow-2xl sm:px-10 border border-rose-400/40 text-center backdrop-blur-xl before:absolute before:inset-2 before:border before:border-dashed before:border-white/80 dark:before:border-white/20 before:pointer-events-none before:rounded-2xl">
          <div className="relative z-10">
            <div className="w-20 h-20 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4 border-2 border-white ring-2 ring-rose-400/40 shadow-md">
              <XCircle className="w-10 h-10" />
            </div>

            <h2 className="text-2xl font-black text-rose-700 dark:text-rose-300">{t('rejectedTitle')}</h2>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              {t('rejectedMsg')}
            </p>

            <div className="my-6 border-t border-slate-100 dark:border-white/10" />

            <div className="text-left bg-slate-50/90 dark:bg-[#0B130E] rounded-2xl p-4 border border-slate-200 dark:border-white/10 space-y-2 mb-6">
              <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
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
              className="w-full py-3.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-black text-sm rounded-xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center space-x-2 border-2 border-white/40"
            >
              <LogOut className="w-4 h-4" />
              <span>{t('logout')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
