import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';

export default function AwaitingApprovalScreen() {
  const { t } = useI18n();
  const { user, refreshProfile, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefreshStatus = async () => {
    setRefreshing(true);
    try {
      const nextUser = await refreshProfile();
      if (nextUser) {
        if (nextUser.status === 'approved') {
          Alert.alert(t('success'), t('accountApprovedMsg'));
        } else {
          Alert.alert(t('statusInfo'), t('statusStillReview'));
        }
      } else {
        Alert.alert(t('error'), t('statusCheckFailed'));
      }
    } catch (error) {
      Alert.alert(t('error') || 'Error', 'Failed to refresh status.');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Image
          source={{ uri: 'https://perilloplywood.in/wp-content/uploads/2025/06/cropped-footerlogo-270x270.jpg' }}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>{t('pendingApprovalTitle') || 'Verification Pending'}</Text>
        <Text style={styles.description}>
          {t('pendingApprovalMsg') || 'Thank you for registering. Your profile is currently under review by Perillo administrators. You will be notified once approved.'}
        </Text>

        <View style={styles.divider} />

        <Text style={styles.detailsHeader}>{t('submittedDetails')}</Text>
        <View style={styles.detailsBox}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('fullName')}:</Text>
            <Text style={styles.detailValue}>{user?.name || '-'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('mobile')}:</Text>
            <Text style={styles.detailValue}>+91 {user?.phone || '-'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('aadhaar')}:</Text>
            <Text style={styles.detailValue}>
              {user?.aadhaar_number
                ? '•••• •••• ' + user.aadhaar_number.slice(-4)
                : '-'}
            </Text>
          </View>
          {user?.pan_card ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('panCard')}:</Text>
              <Text style={styles.detailValue}>{'••••••' + user.pan_card.slice(-4)}</Text>
            </View>
          ) : null}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('region')}:</Text>
            <Text style={styles.detailValue}>{user?.city && user?.state ? `${user.city}, ${user.state}` : user?.city || user?.state || '-'}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, refreshing && styles.buttonDisabled]}
          onPress={handleRefreshStatus}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.buttonText}>{t('refreshStatus') || 'Check Approval Status'}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutLink} onPress={logout}>
          <Text style={styles.logoutText}>{t('logout') || 'Logout'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F3F6F4',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#1E4620',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    alignItems: 'center',
    width: '100%',
    maxWidth: 450,
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E4620',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    fontWeight: '500',
  },
  divider: {
    height: 1.5,
    backgroundColor: '#E2E8F0',
    width: '100%',
    marginBottom: 16,
  },
  detailsHeader: {
    alignSelf: 'flex-start',
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailsBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    width: '100%',
    marginBottom: 24,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  button: {
    backgroundColor: '#1E4620',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: '#1E4620',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  logoutLink: {
    marginTop: 20,
    padding: 8,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});
