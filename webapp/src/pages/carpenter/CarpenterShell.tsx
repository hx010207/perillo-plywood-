import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { Stats, Invoice } from '../../types';
import { fetchStats } from '../../services/api';
import { Header } from '../../components/common/Header';
import { CarpenterNavBar, CarpenterTab } from '../../components/navigation/CarpenterNavBar';
import { GradientWaves } from '../../components/reactbits/GradientWaves';

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
    tierColor: '#94A3B8',
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
    <div className="min-h-screen flex flex-col relative text-slate-900 dark:text-white selection:bg-[#10B981] selection:text-black">
      {/* ReactBits GradientWaves Animated Canvas Background */}
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

      {/* Header */}
      <Header verified={stats.verified} />

      {/* Banner for more_info_requested */}
      {isMoreInfo && (
        <div className="bg-amber-500 text-slate-950 font-bold text-xs sm:text-sm py-2.5 px-4 text-center border-b border-amber-600 flex items-center justify-center space-x-2 shadow-sm">
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

      {/* Main Content Area with Semi-transparent backdrop blur wrapper */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 relative z-10">
        <div className="w-full rounded-3xl bg-white/80 dark:bg-[#080F0A]/85 backdrop-blur-md p-4 sm:p-6 lg:p-8 shadow-sm border border-[#10B981]/20 transition-colors duration-300">
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
