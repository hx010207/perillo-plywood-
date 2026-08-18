import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Alert, StatusBar, Image, Animated, Easing, Dimensions } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

// Screen Imports
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import UploadInvoiceScreen from './src/screens/UploadInvoiceScreen';
import LedgerScreen from './src/screens/LedgerScreen';
import WalletScreen from './src/screens/WalletScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AdminShellScreen from './src/screens/admin/AdminShellScreen';
import AwaitingApprovalScreen from './src/screens/AwaitingApprovalScreen';
import RejectedScreen from './src/screens/RejectedScreen';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { I18nProvider, useI18n } from './src/i18n';
import { resolveApiBaseUrl } from './src/config/backend';
import { ErrorBoundary } from './src/components/ErrorBoundary';

const API_URL = resolveApiBaseUrl();

// ─── Branded Splash Screen ────────────────────────────────────────────────
function SplashScreen({ onFinish }) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.4)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const exitAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Failsafe timer: automatically finish splash after 2s max
    const fallbackTimer = setTimeout(() => {
      if (onFinish) onFinish();
    }, 2200);

    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.back(1.4)),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => {
        Animated.timing(exitAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }).start(() => {
          clearTimeout(fallbackTimer);
          if (onFinish) onFinish();
        });
      }, 600);
    });

    return () => clearTimeout(fallbackTimer);
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[splashStyles.container, { opacity: exitAnim }]}>
      <ExpoStatusBar style="light" />
      <Animated.View
        style={[
          splashStyles.logoCircle,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }, { rotate }],
          },
        ]}
      >
        <Image
          source={{ uri: 'https://perilloplywood.in/wp-content/uploads/2025/06/cropped-footerlogo-270x270.jpg' }}
          style={splashStyles.logoImage}
          resizeMode="cover"
        />
      </Animated.View>

      <Text style={splashStyles.brandName}>Perillo Plywood</Text>
      <Text style={splashStyles.tagline}>Loyalty & Rewards Portal</Text>

      <View style={splashStyles.loaderRow}>
        <ActivityIndicator color="#D9C5B2" size="small" />
      </View>
    </Animated.View>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1410',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#8C6D58',
    marginBottom: 20,
    shadowColor: '#8C6D58',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  brandName: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FAF7F2',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 13,
    color: '#D9C5B2',
    fontWeight: '700',
    marginTop: 6,
  },
  loaderRow: {
    marginTop: 28,
  },
});

function AppContent() {
  const insets = useSafeAreaInsets();
  const { language, setLanguage, supportedLanguages, t } = useI18n();
  const { user, logout, updateUser } = useAuth();
  const [currentScreen, setCurrentScreen] = useState('DASHBOARD');
  const [activeTab, setActiveTab] = useState('HOME');
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => setRefreshKey((prev) => prev + 1);
  const [selectedLedgerItem, setSelectedLedgerItem] = useState(null);
  const [stats, setStats] = useState({
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

  useEffect(() => {
    if (user?.role === 'carpenter') {
      setCurrentScreen('DASHBOARD');
      setActiveTab('HOME');
    }
    if (!user) {
      setCurrentScreen('LOGIN');
      setActiveTab('HOME');
      setSelectedLedgerItem(null);
    }
  }, [user?.id, user?.role]);

  // Fetch points balance, claim counts, and tier info
  const fetchStats = async (userId) => {
    if (!userId) return;
    try {
      const response = await fetch(`${API_URL}/stats/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
        updateUser({ points_balance: data.pointsBalance });
      }
    } catch (error) {
      console.warn('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    if (user?.id && user?.role !== 'admin') {
      fetchStats(user.id);
      const interval = setInterval(() => fetchStats(user.id), 5000);
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  const handleLogout = () => {
    Alert.alert(t('logoutConfirmTitle') || 'Logout', t('logoutConfirmMsg') || 'Are you sure you want to log out?', [
      { text: t('cancel') || 'Cancel', style: 'cancel' },
      {
        text: t('logout') || 'Logout',
        style: 'destructive',
        onPress: () => {
          logout();
          setCurrentScreen('LOGIN');
          setActiveTab('HOME');
        },
      },
    ]);
  };

  // Header with proper safe area insets
  const renderHeader = () => {
    return (
      <View style={[styles.headerSafeArea, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image 
              source={{ uri: 'https://perilloplywood.in/wp-content/uploads/2025/06/cropped-footerlogo-270x270.jpg' }} 
              style={styles.logo}
              resizeMode="cover"
            />
            <View>
              <Text style={styles.brandTitle}>{t('appName') || 'Perillo Rewards'}</Text>
              {stats.verified && (
                <Text style={styles.verifiedBadgeSmall}>✓ Verified Account</Text>
              )}
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => {
                const currentIndex = supportedLanguages.findIndex((item) => item.code === language);
                const nextLanguage = supportedLanguages[(currentIndex + 1) % supportedLanguages.length]?.code || 'en';
                setLanguage(nextLanguage);
              }}
              style={styles.languageButton}
            >
              <Text style={styles.languageButtonText}>{(supportedLanguages.find((item) => item.code === language) || supportedLanguages[0]).label}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Text style={styles.logoutText}>{t('logout') || 'Logout'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // Bottom Tab Bar with safe area
  const renderBottomTabBar = () => {
    const tabs = [
      { key: 'HOME', label: t('tabHome') || 'Home', icon: '🏠' },
      { key: 'LEDGER', label: t('tabLedger') || 'Ledger', icon: '📋' },
      { key: 'WALLET', label: t('tabWallet') || 'Wallet', icon: '💰' },
      { key: 'PROFILE', label: t('tabProfile') || 'Profile', icon: '👤' },
    ];

    return (
      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity 
              key={tab.key}
              style={styles.tabItem} 
              onPress={() => {
                setActiveTab(tab.key);
                setCurrentScreen('DASHBOARD');
              }}
            >
              <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <LoginScreen />
        <ExpoStatusBar style="dark" />
      </View>
    );
  }

  if (user.role === 'admin' || user.role === 'super_admin') {
    return (
      <View style={styles.container}>
        <AdminShellScreen baseUrl={API_URL} />
        <ExpoStatusBar style="light" />
      </View>
    );
  }

  if (user.role === 'carpenter') {
    if (user.status === 'pending_approval') {
      return (
        <View style={styles.container}>
          <AwaitingApprovalScreen />
          <ExpoStatusBar style="dark" />
        </View>
      );
    }

    if (user.status === 'rejected') {
      return (
        <View style={styles.container}>
          <RejectedScreen />
          <ExpoStatusBar style="dark" />
        </View>
      );
    }

    if (user.status === 'more_info_requested') {
      return (
        <View style={styles.container}>
          <View style={[styles.headerSafeArea, { paddingTop: insets.top }]}>
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Image 
                  source={{ uri: 'https://perilloplywood.in/wp-content/uploads/2025/06/cropped-footerlogo-270x270.jpg' }} 
                  style={styles.logo}
                  resizeMode="cover"
                />
                <Text style={styles.brandTitle}>{t('appName') || 'Perillo Rewards'}</Text>
              </View>
              <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                <Text style={styles.logoutText}>{t('logout') || 'Logout'}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.infoBanner}>
            <Text style={styles.infoBannerText}>
              ⚠️ {t('moreInfoMsg') || 'Admin requested more information. Please update your details and save.'}
            </Text>
          </View>
          <View style={styles.content}>
            <ProfileScreen 
              user={user} 
              stats={stats}
              apiUrl={API_URL} 
              t={t}
              autoEdit={true}
              onUpdateUser={(updatedUser) => updateUser(updatedUser)}
            />
          </View>
          <ExpoStatusBar style="dark" />
        </View>
      );
    }
  }

  // Main app screens
  return (
    <View style={styles.container}>
      {renderHeader()}

      <View style={styles.content}>
        {currentScreen === 'UPLOAD_INVOICE' && (
          <UploadInvoiceScreen 
            user={user} 
            apiUrl={API_URL} 
            t={t}
            onBack={() => {
              setCurrentScreen('DASHBOARD');
              triggerRefresh();
              fetchStats(user.id);
            }} 
          />
        )}

        {currentScreen === 'DASHBOARD' && activeTab === 'HOME' && (
          <DashboardScreen 
            user={user} 
            stats={stats}
            apiUrl={API_URL}
            t={t}
            refreshKey={refreshKey}
            onNavigateUpload={() => setCurrentScreen('UPLOAD_INVOICE')} 
            onViewLedgerItem={(item) => {
              setSelectedLedgerItem(item);
              setCurrentScreen('LEDGER_DETAIL');
            }}
          />
        )}

        {currentScreen === 'DASHBOARD' && activeTab === 'LEDGER' && (
          <LedgerScreen 
            user={user} 
            apiUrl={API_URL}
            t={t}
            refreshKey={refreshKey}
            onViewItem={(item) => {
              setSelectedLedgerItem(item);
              setCurrentScreen('LEDGER_DETAIL');
            }}
          />
        )}

        {currentScreen === 'LEDGER_DETAIL' && selectedLedgerItem && (
          <View style={styles.detailContainer}>
            <View style={styles.detailHeaderRow}>
              <TouchableOpacity onPress={() => setCurrentScreen('DASHBOARD')} style={styles.backButton}>
                <Text style={styles.backButtonText}>← {t('back') || 'Back'}</Text>
              </TouchableOpacity>
              <Text style={styles.detailTitle}>{t('invoiceDetails') || 'Invoice Details'}</Text>
              <View style={{ width: 60 }} />
            </View>
            <LedgerScreen.Detail item={selectedLedgerItem} apiUrl={API_URL} t={t} />
          </View>
        )}

        {currentScreen === 'DASHBOARD' && activeTab === 'WALLET' && (
          <WalletScreen 
            user={user} 
            stats={stats}
            apiUrl={API_URL} 
            t={t}
            onRefreshStats={() => fetchStats(user.id)}
          />
        )}

        {currentScreen === 'DASHBOARD' && activeTab === 'PROFILE' && (
          <ProfileScreen 
            user={user} 
            stats={stats}
            apiUrl={API_URL} 
            t={t}
            onUpdateUser={(updatedUser) => updateUser(updatedUser)}
          />
        )}
      </View>

      {currentScreen === 'DASHBOARD' && renderBottomTabBar()}
      <ExpoStatusBar style="dark" />
    </View>
  );
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <I18nProvider>
          <AuthProvider baseUrl={API_URL}>
            {!splashDone ? (
              <SplashScreen onFinish={() => setSplashDone(true)} />
            ) : (
              <AppContent />
            )}
          </AuthProvider>
        </I18nProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  headerSafeArea: {
    backgroundColor: '#FAF7F2',
  },
  header: {
    height: 58,
    backgroundColor: '#FAF7F2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(140, 109, 88, 0.2)',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#8C6D58',
    marginRight: 10,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#2A1E17',
  },
  verifiedBadgeSmall: {
    fontSize: 10,
    color: '#065F46',
    fontWeight: '800',
  },
  logoutButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(140, 109, 88, 0.25)',
    backgroundColor: 'rgba(140, 109, 88, 0.08)',
  },
  logoutText: {
    color: '#8C6D58',
    fontSize: 12,
    fontWeight: '800',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  languageButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(140, 109, 88, 0.25)',
    backgroundColor: 'rgba(140, 109, 88, 0.08)',
  },
  languageButtonText: {
    color: '#2A1E17',
    fontSize: 11,
    fontWeight: '800',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: '#FAF7F2',
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(140, 109, 88, 0.2)',
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 20,
    color: '#A89F91',
  },
  tabIconActive: {
    color: '#8C6D58',
  },
  tabLabel: {
    fontSize: 10.5,
    color: '#6B5A4E',
    marginTop: 2,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#8C6D58',
    fontWeight: '900',
  },
  detailContainer: {
    flex: 1,
  },
  detailHeaderRow: {
    height: 50,
    backgroundColor: '#FAF7F2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(140, 109, 88, 0.2)',
  },
  backButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  backButtonText: {
    fontSize: 13,
    color: '#8C6D58',
    fontWeight: '800',
  },
  detailTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#2A1E17',
  },
  infoBanner: {
    backgroundColor: '#FEF3C7',
    borderBottomWidth: 1.5,
    borderBottomColor: '#F59E0B',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBannerText: {
    color: '#B45309',
    fontWeight: '800',
    fontSize: 12.5,
    textAlign: 'center',
  },
});
