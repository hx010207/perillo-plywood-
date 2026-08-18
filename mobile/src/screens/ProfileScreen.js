import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';

export default function ProfileScreen({ user, stats, apiUrl, onUpdateUser, autoEdit = false, t = (key) => key }) {
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(autoEdit);

  const [name, setName] = useState(user.name || '');
  const [region, setRegion] = useState(user.region || '');
  const [upiId, setUpiId] = useState(user.upi_id || '');
  const [bankName, setBankName] = useState(user.bank_name || '');
  const [accountNumber, setAccountNumber] = useState(user.account_number || '');
  const [ifscCode, setIfscCode] = useState(user.ifsc_code || '');
  const [aadhaarNumber, setAadhaarNumber] = useState(user.aadhaar_number || '');
  const [panCard, setPanCard] = useState(user.pan_card || '');

  useEffect(() => {
    setName(user.name || '');
    setRegion(user.region || '');
    setUpiId(user.upi_id || '');
    setBankName(user.bank_name || '');
    setAccountNumber(user.account_number || '');
    setIfscCode(user.ifsc_code || '');
    setAadhaarNumber(user.aadhaar_number || '');
    setPanCard(user.pan_card || '');
    if (autoEdit) {
      setIsEditing(true);
    }
  }, [user, autoEdit]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(t('error'), t('nameRequired'));
      return;
    }
    setLoading(true);

    try {
      const response = await fetch(`${apiUrl}/profile/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          region,
          upi_id: upiId,
          bank_name: bankName,
          account_number: accountNumber,
          ifsc_code: ifscCode,
          aadhaar_number: aadhaarNumber,
          pan_card: panCard.trim().toUpperCase() || undefined
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        onUpdateUser(data.user);
        setIsEditing(false);
        Alert.alert(t('success'), t('profileUpdated'));
      } else {
        Alert.alert(t('error'), data.error || t('profileUpdateFailed'));
      }
    } catch (err) {
      console.error('Update profile error:', err);
      Alert.alert(t('error'), t('profileSaveError'));
    } finally {
      setLoading(false);
    }
  };

  const maskAadhaar = (val) => {
    if (!val || val.length < 4) return val || t('notProvided');
    return '•••• •••• ' + val.slice(-4);
  };

  const maskPan = (val) => {
    if (!val || val.length < 4) return val || t('notProvided');
    return '••••••' + val.slice(-4);
  };

  const verified = stats?.verified;
  const tier = stats?.tier || 'Member';
  const totalSheets = stats?.totalSheets || 0;

  const TIER_ICONS = { Member: '📦', Bronze: '🥉', Silver: '🥈', Gold: '🥇', Platinum: '💎' };
  const TIER_COLORS = { Member: '#94A3B8', Bronze: '#CD7F32', Silver: '#6B7280', Gold: '#F59E0B', Platinum: '#8B5CF6' };

  const renderField = (label, value, icon) => (
    <View style={styles.detailRow}>
      <View style={styles.detailLeft}>
        <Text style={styles.detailIcon}>{icon}</Text>
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={styles.detailValue}>{value || t('notProvided')}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Avatar Card */}
        <View style={styles.avatarCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</Text>
          </View>
          <Text style={styles.profileName}>{user.name}</Text>
          <Text style={styles.profileId}>ID: {user.id}</Text>

          {/* Status Badges */}
          <View style={styles.badgeRow}>
            {verified ? (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>{t('verified')}</Text>
              </View>
            ) : (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingText}>{t('pendingVerification')}</Text>
              </View>
            )}
            <View style={[styles.tierBadge, { backgroundColor: TIER_COLORS[tier] + '20', borderColor: TIER_COLORS[tier] }]}>
              <Text style={styles.tierBadgeIcon}>{TIER_ICONS[tier]}</Text>
              <Text style={[styles.tierBadgeText, { color: TIER_COLORS[tier] }]}>{tier}</Text>
            </View>
          </View>
          <Text style={styles.sheetCountText}>{totalSheets} {t('sheetsPurchased')}</Text>
        </View>

        {/* View / Edit */}
        {!isEditing ? (
          <View style={styles.infoSection}>
            {/* Personal Details */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('personalDetails')}</Text>
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <Text style={styles.editLink}>{t('editInfo')}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              {renderField(t('mobile'), `+91 ${user.phone}`, '📱')}
              {renderField(t('region'), user.region, '📍')}
              {renderField(t('aadhaar'), maskAadhaar(user.aadhaar_number), '🪪')}
              {renderField(t('panCard'), maskPan(user.pan_card), '💳')}
            </View>

            {/* Bank Details */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('bankUpiDetails')}</Text>
            </View>

            <View style={styles.card}>
              {renderField(t('upiId'), user.upi_id, '⚡')}
              {renderField(t('bankName'), user.bank_name, '🏦')}
              {renderField(t('accountNumber'), user.account_number, '💳')}
              {renderField(t('ifscCode'), user.ifsc_code, '🔑')}
            </View>
          </View>
        ) : (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>{t('editProfileTitle')}</Text>
            
            <View style={styles.card}>
              <Text style={styles.inputLabel}>{t('fullName')}</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder={t('fullNamePlaceholder')} />

              <Text style={styles.inputLabel}>{t('region')}</Text>
              <TextInput style={styles.input} value={region} onChangeText={setRegion} placeholder={t('regionPlaceholder')} />

              <Text style={styles.inputLabel}>{t('aadhaar')}</Text>
              <TextInput style={styles.input} value={aadhaarNumber} onChangeText={setAadhaarNumber} placeholder={t('aadhaarPlaceholder')} keyboardType="numeric" maxLength={12} />

              <Text style={styles.inputLabel}>{t('panCardLabel')}</Text>
              <TextInput style={styles.input} value={panCard} onChangeText={(text) => setPanCard(text.toUpperCase())} placeholder={t('panCardPlaceholder')} autoCapitalize="characters" maxLength={10} />
            </View>

            <Text style={styles.sectionTitle}>{t('payoutBankSettings')}</Text>

            <View style={styles.card}>
              <Text style={styles.inputLabel}>{t('upiLabel')}</Text>
              <TextInput style={styles.input} value={upiId} onChangeText={setUpiId} placeholder={t('upiPlaceholder')} autoCapitalize="none" />

              <Text style={styles.inputLabel}>{t('bankNameLabel')}</Text>
              <TextInput style={styles.input} value={bankName} onChangeText={setBankName} placeholder={t('bankNamePlaceholder')} />

              <Text style={styles.inputLabel}>{t('accountLabel')}</Text>
              <TextInput style={styles.input} value={accountNumber} onChangeText={setAccountNumber} placeholder={t('accountPlaceholder')} keyboardType="numeric" />

              <Text style={styles.inputLabel}>{t('ifscLabel')}</Text>
              <TextInput style={styles.input} value={ifscCode} onChangeText={setIfscCode} placeholder={t('ifscPlaceholder')} autoCapitalize="characters" />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setIsEditing(false)}>
                <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>{t('saveDetails')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 16, paddingBottom: 40 },

  avatarCard: { alignItems: 'center', marginVertical: 16 },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1E4620', alignItems: 'center', justifyContent: 'center', shadowColor: '#1E4620', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  avatarLetter: { fontSize: 36, fontWeight: 'bold', color: '#FFFFFF' },
  profileName: { fontSize: 20, fontWeight: 'bold', color: '#1E293B', marginTop: 10 },
  profileId: { fontSize: 12, color: '#94A3B8', marginTop: 3, fontWeight: '600' },

  badgeRow: { flexDirection: 'row', marginTop: 10, gap: 8 },
  verifiedBadge: { backgroundColor: '#DCFCE7', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: '#86EFAC' },
  verifiedText: { fontSize: 11, fontWeight: '700', color: '#166534' },
  pendingBadge: { backgroundColor: '#FEF9C3', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: '#FDE047' },
  pendingText: { fontSize: 11, fontWeight: '700', color: '#854D0E' },
  tierBadge: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1 },
  tierBadgeIcon: { fontSize: 12, marginRight: 4 },
  tierBadgeText: { fontSize: 11, fontWeight: '800' },
  sheetCountText: { fontSize: 11, color: '#94A3B8', marginTop: 6, fontWeight: '600' },

  infoSection: { marginTop: 6 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#1E4620' },
  editLink: { fontSize: 13, color: '#D97706', fontWeight: 'bold' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  detailLeft: { flexDirection: 'row', alignItems: 'center' },
  detailIcon: { fontSize: 16, marginRight: 10 },
  detailLabel: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  detailValue: { fontSize: 13, color: '#1E293B', fontWeight: '600', maxWidth: '50%', textAlign: 'right' },

  formSection: { marginTop: 6 },
  inputLabel: { fontSize: 11, fontWeight: '600', color: '#64748B', marginTop: 8, marginBottom: 5 },
  input: { borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 10, backgroundColor: '#F8FAFC', paddingHorizontal: 12, height: 42, fontSize: 14, color: '#1E293B', fontWeight: '500', marginBottom: 6 },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelButton: { flex: 1, borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 12, height: 46, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  cancelButtonText: { color: '#64748B', fontSize: 14, fontWeight: 'bold' },
  saveButton: { flex: 2, backgroundColor: '#1E4620', borderRadius: 12, height: 46, alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
});
