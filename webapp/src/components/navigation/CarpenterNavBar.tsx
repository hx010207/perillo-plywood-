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
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#FAF7F2]/90 dark:bg-[#1C1410]/90 backdrop-blur-xl border-t border-[#8C6D58]/20 shadow-lg sm:sticky sm:bottom-auto sm:top-[68px] sm:border-t-0 sm:border-b transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex items-center justify-around sm:justify-start sm:space-x-4 py-2 sm:py-0">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 py-2 sm:py-3.5 px-3.5 sm:px-4 rounded-xl font-bold text-xs sm:text-sm transition-colors ${
                  isActive
                    ? 'text-[#8C6D58] dark:text-[#FAF7F2]'
                    : 'text-[#6B5A4E] hover:text-[#2A1E17] dark:text-[#C4B5A5] dark:hover:text-white'
                }`}
              >
                {/* Active Tab Sliding Pill Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="carpenterTabIndicator"
                    className="absolute inset-0 bg-[#8C6D58]/15 sm:bg-[#8C6D58]/10 rounded-xl sm:rounded-none sm:border-b-2 sm:border-[#8C6D58] dark:sm:border-[#D9C5B2] -z-10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}

                <span className={isActive ? 'text-[#8C6D58] dark:text-[#D9C5B2]' : 'text-[#8C6D58]/70 dark:text-stone-400'}>
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
