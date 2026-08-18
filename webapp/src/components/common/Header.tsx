import React, { useState } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, Globe, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { Modal } from './Modal';

interface HeaderProps {
  verified?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ verified }) => {
  const { t, language, setLanguage, supportedLanguages } = useI18n();
  const { logout, user } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const currentLangLabel = supportedLanguages.find(l => l.code === language)?.label || 'English';

  const handleNextLanguage = () => {
    const currentIndex = supportedLanguages.findIndex(l => l.code === language);
    const nextLang = supportedLanguages[(currentIndex + 1) % supportedLanguages.length];
    setLanguage(nextLang.code);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#08140B]/85 backdrop-blur-2xl text-white shadow-2xl border-b border-white/10 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Identity */}
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl overflow-hidden bg-white p-0.5 shadow-lg border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
              <img 
                src="https://perilloplywood.in/wp-content/uploads/2025/06/cropped-footerlogo-270x270.jpg" 
                alt="Perillo Plywood" 
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-xl font-black font-display tracking-tight text-white">
                  {t('appName')}
                </h1>
                {verified ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-xs">
                    <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-400" />
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                    Pending
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-400/80 font-mono hidden sm:block">
                Loyalty Rewards Portal • Hubballi
              </p>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Language Switcher Toggle */}
            <button
              onClick={handleNextLanguage}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-bold text-slate-200 hover:text-white transition-all active:scale-95 shadow-sm"
              title="Switch Language"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>{currentLangLabel}</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/15 hover:border-rose-400/40 text-xs font-bold text-slate-300 hover:text-rose-300 transition-all active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('logout')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title={t('logoutConfirmTitle')}
      >
        <div className="space-y-4">
          <p className="text-slate-300 text-sm font-medium">{t('logoutConfirmMsg')}</p>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-white/15 text-slate-300 hover:bg-white/10 transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              onClick={() => {
                setShowLogoutConfirm(false);
                logout();
              }}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-colors"
            >
              {t('logout')}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
