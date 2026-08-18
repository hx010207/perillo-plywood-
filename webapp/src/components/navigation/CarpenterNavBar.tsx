import React from 'react';
import { Home, ClipboardList, Wallet, User as UserIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useI18n } from '../../contexts/I18nContext';

export type CarpenterTab = 'HOME' | 'LEDGER' | 'WALLET' | 'PROFILE';

interface CarpenterNavBarProps {
  activeTab: CarpenterTab;
  setActiveTab: (tab: CarpenterTab) => void;
}

export const CarpenterNavBar: React.FC<CarpenterNavBarProps> = ({ activeTab, setActiveTab }) => {
  const { t } = useI18n();

  const tabs: { key: CarpenterTab; label: string; icon: React.ReactNode }[] = [
    { key: 'HOME', label: t('tabHome'), icon: <Home className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { key: 'LEDGER', label: t('tabLedger'), icon: <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { key: 'WALLET', label: t('tabWallet'), icon: <Wallet className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { key: 'PROFILE', label: t('tabProfile'), icon: <UserIcon className="w-4 h-4 sm:w-5 sm:h-5" /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-[#080F0A]/90 backdrop-blur-2xl border-t border-emerald-950/10 dark:border-white/10 shadow-lg dark:shadow-2xl sm:sticky sm:bottom-auto sm:top-[68px] sm:border-t-0 sm:border-b transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex items-center justify-around sm:justify-start sm:space-x-4 py-2 sm:py-0">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 py-2 sm:py-3.5 px-3 sm:px-4 rounded-xl font-bold text-xs sm:text-sm transition-colors ${
                  isActive
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {/* Active Tab Sliding Pill Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="carpenterTabIndicator"
                    className="absolute inset-0 bg-emerald-500/15 sm:bg-emerald-500/10 rounded-xl sm:rounded-none sm:border-b-2 sm:border-emerald-600 dark:sm:border-emerald-400 -z-10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}

                <span className={isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
