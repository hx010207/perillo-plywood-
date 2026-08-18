import React from 'react';
import { Home, ClipboardList, Wallet, User as UserIcon } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';

export type CarpenterTab = 'HOME' | 'LEDGER' | 'WALLET' | 'PROFILE';

interface CarpenterNavBarProps {
  activeTab: CarpenterTab;
  setActiveTab: (tab: CarpenterTab) => void;
}

export const CarpenterNavBar: React.FC<CarpenterNavBarProps> = ({ activeTab, setActiveTab }) => {
  const { t } = useI18n();

  const tabs: { key: CarpenterTab; label: string; icon: React.ReactNode }[] = [
    { key: 'HOME', label: t('tabHome'), icon: <Home className="w-5 h-5" /> },
    { key: 'LEDGER', label: t('tabLedger'), icon: <ClipboardList className="w-5 h-5" /> },
    { key: 'WALLET', label: t('tabWallet'), icon: <Wallet className="w-5 h-5" /> },
    { key: 'PROFILE', label: t('tabProfile'), icon: <UserIcon className="w-5 h-5" /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 shadow-lg sm:sticky sm:bottom-auto sm:top-[65px] sm:border-t-0 sm:border-b sm:shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex items-center justify-around sm:justify-start sm:space-x-8 py-2 sm:py-0">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 py-1.5 sm:py-3 px-3 rounded-xl sm:rounded-none sm:border-b-2 font-bold text-xs sm:text-sm transition-all ${
                  isActive
                    ? 'text-[#1E4620] sm:border-[#1E4620] bg-emerald-50/60 sm:bg-transparent'
                    : 'text-slate-400 sm:border-transparent hover:text-slate-600 hover:bg-slate-50 sm:hover:bg-transparent'
                }`}
              >
                <span className={isActive ? 'text-[#1E4620]' : 'text-slate-400'}>
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
