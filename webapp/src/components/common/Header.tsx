import React, { useState } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { LogOut, Globe, CheckCircle2, Sun, Moon } from 'lucide-react';
import { Modal } from './Modal';

interface HeaderProps {
  verified?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ verified }) => {
  const { t, language, setLanguage, supportedLanguages } = useI18n();
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const currentLangLabel = supportedLanguages.find(l => l.code === language)?.label || 'English';

  const handleNextLanguage = () => {
    const currentIndex = supportedLanguages.findIndex(l => l.code === language);
    const nextLang = supportedLanguages[(currentIndex + 1) % supportedLanguages.length];
    setLanguage(nextLang.code);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FAF7F2]/85 dark:bg-[#1C1410]/90 backdrop-blur-lg text-[#2A1E17] dark:text-[#FAF7F2] shadow-sm border-b border-[#8C6D58]/20 px-4 sm:px-8 py-3.5 transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Identity */}
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-full overflow-hidden bg-white p-0.5 shadow-md border-2 border-white ring-2 ring-[#8C6D58]/40 flex items-center justify-center flex-shrink-0">
              <img 
                src="https://perilloplywood.in/wp-content/uploads/2025/06/cropped-footerlogo-270x270.jpg" 
                alt="Perillo Plywood" 
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-xl font-black tracking-tight text-[#2A1E17] dark:text-[#FAF7F2]">
                  {t('appName')}
                </h1>
                {verified ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-[#10B981]/15 text-[#065F46] dark:text-emerald-300 border border-[#10B981]/30 shadow-xs">
                    <CheckCircle2 className="w-3 h-3 mr-1 text-[#065F46] dark:text-emerald-400" />
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                    Pending
                  </span>
                )}
              </div>
              <p className="text-xs text-[#6B5A4E] dark:text-[#C4B5A5] font-semibold hidden sm:block">
                Loyalty Rewards Portal • Hubballi
              </p>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-white/70 hover:bg-white dark:bg-white/5 dark:hover:bg-white/10 border border-[#8C6D58]/20 text-[#6B5A4E] dark:text-slate-200 transition-all active:scale-95 shadow-xs"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-[#8C6D58]" />
              )}
            </button>

            {/* Language Switcher Toggle */}
            <button
              onClick={handleNextLanguage}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-white/70 hover:bg-white dark:bg-white/5 dark:hover:bg-white/10 border border-[#8C6D58]/20 text-xs font-bold text-[#2A1E17] dark:text-slate-200 transition-all active:scale-95 shadow-xs"
              title="Switch Language"
            >
              <Globe className="w-3.5 h-3.5 text-[#8C6D58] dark:text-amber-400" />
              <span>{currentLangLabel}</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-white/70 hover:bg-rose-100 dark:bg-white/5 dark:hover:bg-rose-500/20 border border-[#8C6D58]/20 hover:border-rose-300 text-xs font-bold text-[#6B5A4E] hover:text-rose-700 dark:text-slate-300 dark:hover:text-rose-300 transition-all active:scale-95"
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
          <p className="text-[#6B5A4E] dark:text-slate-300 text-sm font-medium">{t('logoutConfirmMsg')}</p>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-[#8C6D58]/30 text-[#6B5A4E] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
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
