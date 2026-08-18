import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { XCircle, LogOut, PhoneCall, Mail } from 'lucide-react';

export const RejectedPage: React.FC = () => {
  const { t } = useI18n();
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-rose-50/50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl sm:px-10 border border-rose-200 text-center">
          <div className="w-20 h-20 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-black text-rose-900">{t('rejectedTitle')}</h2>
          <p className="text-sm font-medium text-slate-600 mt-2 leading-relaxed">
            {t('rejectedMsg')}
          </p>

          <div className="my-6 border-t border-slate-200" />

          <div className="text-left bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 mb-6">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Support Desk
            </h4>
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700">
              <Mail className="w-4 h-4 text-emerald-700" />
              <span>Email: support@perilloplywood.in</span>
            </div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700">
              <PhoneCall className="w-4 h-4 text-emerald-700" />
              <span>Helpline: +91 1800 200 9988</span>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full py-3 px-4 bg-rose-700 hover:bg-rose-800 text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center space-x-2"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('logout')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
