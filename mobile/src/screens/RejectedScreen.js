import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';

export default function RejectedScreen() {
  const { t } = useI18n();
  const { logout } = useAuth();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <View style={styles.errorIconCircle}>
          <Text style={styles.errorIcon}>✗</Text>
        </View>

        <Text style={styles.title}>{t('rejectedTitle') || 'Application Rejected'}</Text>
        <Text style={styles.description}>
          {t('rejectedMsg') || 'Unfortunately, your application could not be approved at this time. Please contact Perillo support for more details.'}
        </Text>

        <View style={styles.divider} />

        <View style={styles.supportBox}>
          <Text style={styles.supportHeader}>Support Desk</Text>
          <Text style={styles.supportContact}>Email: support@perilloplywood.in</Text>
          <Text style={styles.supportContact}>Helpline: +91 1800 200 9988</Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={logout}>
          <Text style={styles.buttonText}>{t('logout') || 'Logout'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#FBF2F2',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    alignItems: 'center',
    width: '100%',
    maxWidth: 450,
  },
  errorIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  errorIcon: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#991B1B',
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
  supportBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    width: '100%',
    marginBottom: 24,
    gap: 4,
  },
  supportHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  supportContact: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  button: {
    backgroundColor: '#991B1B',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: '#991B1B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
