import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { Stats, Invoice } from '../../types';
import { fetchStats } from '../../services/api';
import { Header } from '../../components/common/Header';
import { CarpenterNavBar, CarpenterTab } from '../../components/navigation/CarpenterNavBar';
import { ThemeGradientWaves } from '../../components/reactbits/ThemeGradientWaves';

import { DashboardHomeTab } from './DashboardHomeTab';
import { UploadInvoiceTab } from './UploadInvoiceTab';
import { LedgerTab } from './LedgerTab';
import { LedgerDetailTab } from './LedgerDetailTab';
import { WalletTab } from './WalletTab';
import { ProfileTab } from './ProfileTab';
import { AlertTriangle } from 'lucide-react';

export const CarpenterShell: React.FC = () => {
  const { t } = useI18n();
  const { user, logout, updateUser } = useAuth();

  const [currentScreen, setCurrentScreen] = useState<'DASHBOARD' | 'UPLOAD_INVOICE' | 'LEDGER_DETAIL'>('DASHBOARD');
  const [activeTab, setActiveTab] = useState<CarpenterTab>('HOME');
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedLedgerItem, setSelectedLedgerItem] = useState<Invoice | null>(null);

  const triggerRefresh = () => setRefreshKey((prev) => prev + 1);

  const [stats, setStats] = useState<Stats>({
    pointsBalance: 0,
    pendingClaims: 0,
    approvedClaims: 0,
    totalSheets: 0,
    tier: 'Member',
    tierColor: '#8C6D58',
    tierRewardPct: 0.8,
    nextTier: 'Bronze',
    nextTierSheets: 100,
    verified: false,
  });

  const loadStats = async (userId: string) => {
    if (!userId) return;
    try {
      const data = await fetchStats(userId);
      setStats(data);
      updateUser({ points_balance: data.pointsBalance });
    } catch (err) {
      console.warn('Error fetching stats:', err);
    }
  };

  useEffect(() => {
    if (!user?.id || user?.role !== 'carpenter') return;
    loadStats(user.id);
    const interval = setInterval(() => loadStats(user.id), 5000);
    return () => clearInterval(interval);
  }, [user?.id, user?.role]);

  if (!user) return null;

  // Handle user requested info status banner
  const isMoreInfo = user.status === 'more_info_requested';

  return (
    <div className="relative w-full min-h-screen selection:bg-[#8C6D58] selection:text-white">
      {/* 1. Full-Screen Dynamic Theme GradientWaves (Light Linen vs Dark Timber Mocha) */}
      <ThemeGradientWaves />

      {/* 2. Foreground Content Container */}
      <main className="relative z-10 w-full min-h-screen flex flex-col">
        {/* Header */}
        <Header verified={stats.verified} />

        {/* Banner for more_info_requested */}
        {isMoreInfo && (
          <div className="bg-amber-600 text-white font-bold text-xs sm:text-sm py-2.5 px-4 text-center border-b border-amber-700 flex items-center justify-center space-x-2 shadow-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{t('moreInfoMsg') || 'Admin requested more information. Please update your details and save.'}</span>
          </div>
        )}

        {/* Sticky Tab Bar for Carpenter Navigation */}
        {currentScreen === 'DASHBOARD' && (
          <CarpenterNavBar
            activeTab={activeTab}
            setActiveTab={(tab) => {
              setActiveTab(tab);
              setCurrentScreen('DASHBOARD');
            }}
          />
        )}

        {/* Page Tab Area */}
        <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {isMoreInfo ? (
            <ProfileTab
              user={user}
              stats={stats}
              autoEdit={true}
              onUpdateUser={(updated) => updateUser(updated)}
            />
          ) : (
            <>
              {currentScreen === 'UPLOAD_INVOICE' && (
                <UploadInvoiceTab
                  user={user}
                  onBack={() => {
                    setCurrentScreen('DASHBOARD');
                    triggerRefresh();
                    loadStats(user.id);
                  }}
                />
              )}

              {currentScreen === 'DASHBOARD' && activeTab === 'HOME' && (
                <DashboardHomeTab
                  user={user}
                  stats={stats}
                  refreshKey={refreshKey}
                  onNavigateUpload={() => setCurrentScreen('UPLOAD_INVOICE')}
                  onViewLedgerItem={(item) => {
                    setSelectedLedgerItem(item);
                    setCurrentScreen('LEDGER_DETAIL');
                  }}
                />
              )}

              {currentScreen === 'DASHBOARD' && activeTab === 'LEDGER' && (
                <LedgerTab
                  user={user}
                  refreshKey={refreshKey}
                  onViewItem={(item) => {
                    setSelectedLedgerItem(item);
                    setCurrentScreen('LEDGER_DETAIL');
                  }}
                />
              )}

              {currentScreen === 'LEDGER_DETAIL' && selectedLedgerItem && (
                <LedgerDetailTab
                  item={selectedLedgerItem}
                  onBack={() => setCurrentScreen('DASHBOARD')}
                />
              )}

              {currentScreen === 'DASHBOARD' && activeTab === 'WALLET' && (
                <WalletTab
                  user={user}
                  stats={stats}
                  onRefreshStats={() => loadStats(user.id)}
                />
              )}

              {currentScreen === 'DASHBOARD' && activeTab === 'PROFILE' && (
                <ProfileTab
                  user={user}
                  stats={stats}
                  onUpdateUser={(updated) => updateUser(updated)}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};
