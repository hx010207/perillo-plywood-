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

const plywoodImage = require('./src/assets/perillo-plywood-sheet.jpg');

const API_URL = resolveApiBaseUrl();

// ─── Branded Splash Screen ────────────────────────────────────────────────
function SplashScreen({ onFinish }) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.4)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const textFade = useRef(new Animated.Value(0)).current;
  const taglineFade = useRef(new Animated.Value(0)).current;
  const exitAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Image enters: scale up + rotate
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 900,
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
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // After image settles, show text
      Animated.stagger(200, [
        Animated.timing(textFade, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(taglineFade, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Hold for a moment then exit
        setTimeout(() => {
          Animated.timing(exitAnim, {
            toValue: 0,
            duration: 400,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }).start(() => {
            if (onFinish) onFinish();
          });
        }, 800);
      });
    });
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[splashStyles.container, { opacity: exitAnim }]}>
      <ExpoStatusBar style="light" />

      <Animated.Image
        source={plywoodImage}
        style={[
          splashStyles.plywoodImage,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }, { rotate }],
          },
        ]}
        resizeMode="contain"
      />

      <Animated.Text style={[splashStyles.brandName, { opacity: textFade }]}>
        Perillo Plywood
      </Animated.Text>

      <Animated.Text style={[splashStyles.tagline, { opacity: taglineFade }]}>
        For a smart user...
      </Animated.Text>

      <Animated.View style={[splashStyles.loaderRow, { opacity: taglineFade }]}>
        <ActivityIndicator color="#86EFAC" size="small" />
      </Animated.View>
    </Animated.View>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#122814',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plywoodImage: {
    width: SCREEN_WIDTH * 0.52,
    height: SCREEN_WIDTH * 0.52,
    borderRadius: 20,
    marginBottom: 28,
    shadowColor: '#86EFAC',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  brandName: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 14,
    color: '#86EFAC',
    fontWeight: '600',
    marginTop: 8,
    fontStyle: 'italic',
  },
  loaderRow: {
    marginTop: 32,
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
    tierColor: '#94A3B8',
    tierRewardPct: 0.8,
    nextTier: 'Bronze',
    nextTierSheets: 100,
    verified: false
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
    Alert.alert(t('logoutConfirmTitle'), t('logoutConfirmMsg'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('logout'),
        style: 'destructive',
        onPress: () => {
          logout();
          setCurrentScreen('LOGIN');
          setActiveTab('HOME');
        }
      }
    ]);
  };

  // Header with proper safe area insets
  const renderHeader = () => {
    return (
      <View style={[styles.headerSafeArea, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image 
              source={{ uri: 'https://i.ibb.co/rRH94QrC/perillo-new-logo.png' }} 
              style={styles.logo}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.brandTitle}>{t('appName')}</Text>
              {stats.verified && (
                <Text style={styles.verifiedBadgeSmall}>✓ Verified</Text>
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
              <Text style={styles.logoutText}>{t('logout')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // Bottom Tab Bar with safe area
  const renderBottomTabBar = () => {
    const tabs = [
      { key: 'HOME', label: t('tabHome'), icon: '🏠' },
      { key: 'LEDGER', label: t('tabLedger'), icon: '📋' },
      { key: 'WALLET', label: t('tabWallet'), icon: '💰' },
      { key: 'PROFILE', label: t('tabProfile'), icon: '👤' }
    ];

    return (
      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
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
                  source={{ uri: 'https://i.ibb.co/rRH94QrC/perillo-new-logo.png' }} 
                  style={styles.logo}
                  resizeMode="contain"
                />
                <Text style={styles.brandTitle}>{t('appName')}</Text>
              </View>
              <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                <Text style={styles.logoutText}>{t('logout')}</Text>
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
          <ExpoStatusBar style="light" />
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
                  <Text style={styles.backButtonText}>{t('back')}</Text>
              </TouchableOpacity>
                <Text style={styles.detailTitle}>{t('invoiceDetails')}</Text>
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
      <ExpoStatusBar style="light" />
    </View>
  );
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  if (!splashDone) {
    return <SplashScreen onFinish={() => setSplashDone(true)} />;
  }

  return (
    <SafeAreaProvider>
      <I18nProvider>
        <AuthProvider baseUrl={API_URL}>
          <AppContent />
        </AuthProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F6F4',
  },
  headerSafeArea: {
    backgroundColor: '#1E4620',
  },
  header: {
    height: 56,
    backgroundColor: '#1E4620',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#163318',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginRight: 10,
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  verifiedBadgeSmall: {
    fontSize: 10,
    color: '#86EFAC',
    fontWeight: '600',
  },
  logoutButton: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  languageButton: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  languageButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 20,
    color: '#94A3B8',
  },
  tabIconActive: {
    color: '#1E4620',
  },
  tabLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 3,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#1E4620',
    fontWeight: 'bold',
  },
  detailContainer: {
    flex: 1,
  },
  detailHeaderRow: {
    height: 50,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 14,
    color: '#1E4620',
    fontWeight: 'bold',
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E4620',
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
    color: '#D97706',
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
  },
});
