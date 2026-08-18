import React from 'react';
import { LayoutDashboard, CheckSquare, FileText, Users, Award, CreditCard, Settings } from 'lucide-react';

export type AdminTabKey = 'dashboard' | 'approvals' | 'claims' | 'carpenters' | 'tiers' | 'payouts' | 'settings';

interface AdminTabBarProps {
  activeTab: AdminTabKey;
  setActiveTab: (tab: AdminTabKey) => void;
  pendingApprovalsCount?: number;
  pendingClaimsCount?: number;
  pendingPayoutsCount?: number;
}

export const AdminTabBar: React.FC<AdminTabBarProps> = ({
  activeTab,
  setActiveTab,
  pendingApprovalsCount = 0,
  pendingClaimsCount = 0,
  pendingPayoutsCount = 0,
}) => {
  const tabs: { key: AdminTabKey; label: string; icon: React.ReactNode; badgeCount?: number }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { key: 'approvals', label: 'Approvals', icon: <CheckSquare className="w-4 h-4" />, badgeCount: pendingApprovalsCount },
    { key: 'claims', label: 'Claims', icon: <FileText className="w-4 h-4" />, badgeCount: pendingClaimsCount },
    { key: 'carpenters', label: 'Users', icon: <Users className="w-4 h-4" /> },
    { key: 'tiers', label: 'Tiers', icon: <Award className="w-4 h-4" /> },
    { key: 'payouts', label: 'Payouts', icon: <CreditCard className="w-4 h-4" />, badgeCount: pendingPayoutsCount },
    { key: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="bg-[#f4f1ea] border-b border-[#eadfce] px-4 sm:px-8 py-2 overflow-x-auto no-scrollbar">
      <div className="max-w-7xl mx-auto flex items-center space-x-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#16324f] text-white shadow-sm'
                  : 'bg-[#e7dfd3] text-[#4f4a41] hover:bg-[#ded5c6]'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badgeCount && tab.badgeCount > 0 ? (
                <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  isActive ? 'bg-amber-400 text-slate-950' : 'bg-amber-600 text-white'
                }`}>
                  {tab.badgeCount}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
};
