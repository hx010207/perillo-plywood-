import React, { useState } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, Globe, CheckCircle, ShieldCheck } from 'lucide-react';
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
      <header className="sticky top-0 z-40 bg-[#1E4620] text-white shadow-md border-b border-[#163318] px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Identity */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white p-0.5 shadow-sm border border-emerald-400/30 flex items-center justify-center">
              <img 
                src="https://perilloplywood.in/wp-content/uploads/2025/06/cropped-footerlogo-270x270.jpg" 
                alt="Perillo Logo" 
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">{t('appName')}</h1>
                {verified && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-900/60 text-emerald-300 border border-emerald-500/40">
                    <CheckCircle className="w-3 h-3 mr-1 text-emerald-400" />
                    Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-200/80 font-medium hidden sm:block">Loyalty Rewards Portal</p>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Language Switcher */}
            <button
              onClick={handleNextLanguage}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white transition-all active:scale-95"
              title="Switch Language"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-300" />
              <span>{currentLangLabel}</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-red-500/20 border border-white/20 hover:border-red-400/40 text-xs font-bold text-white hover:text-red-200 transition-all active:scale-95"
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
          <p className="text-slate-600 text-sm font-medium">{t('logoutConfirmMsg')}</p>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              onClick={() => {
                setShowLogoutConfirm(false);
                logout();
              }}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm transition-colors"
            >
              {t('logout')}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
