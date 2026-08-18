import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';

const TIER_ICONS = { Member: '🪵', Bronze: '🥉', Silver: '🥈', Gold: '🥇', Platinum: '💎' };

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
      Alert.alert(t('error') || 'Error', t('nameRequired') || 'Please enter full name.');
      return;
    }
    setLoading(true);

    try {
      const response = await fetch(`${apiUrl}/profile/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          region: region.trim(),
          upi_id: upiId.trim(),
          bank_name: bankName.trim(),
          account_number: accountNumber.trim(),
          ifsc_code: ifscCode.trim(),
          aadhaar_number: aadhaarNumber.trim(),
          pan_card: panCard.trim().toUpperCase() || undefined
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        onUpdateUser(data.user);
        setIsEditing(false);
        Alert.alert(t('success') || 'Success', t('profileUpdated') || 'Profile updated successfully.');
      } else {
        Alert.alert(t('error') || 'Error', data.error || 'Failed to update profile.');
      }
    } catch (err) {
      console.error('Update profile error:', err);
      Alert.alert(t('error') || 'Error', 'Network error while updating profile.');
    } finally {
      setLoading(false);
    }
  };

  const maskAadhaar = (val) => {
    if (!val || val.length < 4) return val || 'Not Provided';
    return '•••• •••• ' + val.slice(-4);
  };

  const maskPan = (val) => {
    if (!val || val.length < 4) return val || 'Not Provided';
    return '••••••' + val.slice(-4);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileTopRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{(user.name || 'R').charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.userName}>{user.name || 'Carpenter'}</Text>
                {stats.verified && (
                  <View style={styles.verifiedPill}>
                    <Text style={styles.verifiedText}>✓ Verified</Text>
                  </View>
                )}
              </View>
              <Text style={styles.userPhone}>{user.phone ? `+91 ${user.phone}` : ''} • ID: {user.id}</Text>
              <Text style={styles.userRegion}>{user.region ? `📍 ${user.region}` : 'Hubballi Region'}</Text>
            </View>

            <TouchableOpacity 
              style={styles.editBtn} 
              onPress={() => setIsEditing(!isEditing)}
            >
              <Text style={styles.editBtnText}>{isEditing ? (t('cancel') || 'Cancel') : (t('editProfile') || 'Edit')}</Text>
            </TouchableOpacity>
          </View>

          {/* Stats Bar */}
          <View style={styles.statsBar}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>TIER</Text>
              <Text style={styles.statValue}>{TIER_ICONS[stats.tier] || '🪵'} {stats.tier}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>SHEETS</Text>
              <Text style={styles.statValue}>{stats.totalSheets || 0}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>CASHBACK</Text>
              <Text style={styles.statValue}>{stats.tierRewardPct || 0.8}%</Text>
            </View>
          </View>
        </View>

        {isEditing ? (
          /* Form Mode */
          <View style={styles.card}>
            <Text style={styles.sectionHeader}>Edit KYC & Payout Profile</Text>

            <Text style={styles.inputLabel}>{t('fullName') || 'Full Name'} *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Full Name"
              placeholderTextColor="#A89F91"
            />

            <Text style={styles.inputLabel}>{t('regionLabel') || 'Region / City'}</Text>
            <TextInput
              style={styles.input}
              value={region}
              onChangeText={setRegion}
              placeholder="e.g. Hubballi, Karnataka"
              placeholderTextColor="#A89F91"
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>{t('aadhaar') || 'Aadhaar (12 Digits)'}</Text>
                <TextInput
                  style={styles.input}
                  maxLength={12}
                  keyboardType="numeric"
                  value={aadhaarNumber}
                  onChangeText={(t) => setAadhaarNumber(t.replace(/[^0-9]/g, ''))}
                  placeholder="12-digit Aadhaar"
                  placeholderTextColor="#A89F91"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>{t('panCardLabel') || 'PAN Card'}</Text>
                <TextInput
                  style={styles.input}
                  maxLength={10}
                  autoCapitalize="characters"
                  value={panCard}
                  onChangeText={(t) => setPanCard(t.toUpperCase())}
                  placeholder="ABCDE1234F"
                  placeholderTextColor="#A89F91"
                />
              </View>
            </View>

            <View style={styles.divider} />
            <Text style={styles.sectionHeader}>Bank & UPI Payout Details</Text>

            <Text style={styles.inputLabel}>{t('upiId') || 'UPI ID'}</Text>
            <TextInput
              style={styles.input}
              value={upiId}
              onChangeText={setUpiId}
              placeholder="mobile@upi"
              placeholderTextColor="#A89F91"
            />

            <Text style={styles.inputLabel}>{t('bankName') || 'Bank Name'}</Text>
            <TextInput
              style={styles.input}
              value={bankName}
              onChangeText={setBankName}
              placeholder="e.g. State Bank of India"
              placeholderTextColor="#A89F91"
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>{t('accountNumber') || 'Account Number'}</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={accountNumber}
                  onChangeText={(t) => setAccountNumber(t.replace(/[^0-9]/g, ''))}
                  placeholder="A/C Number"
                  placeholderTextColor="#A89F91"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>{t('ifscCode') || 'IFSC Code'}</Text>
                <TextInput
                  style={styles.input}
                  autoCapitalize="characters"
                  value={ifscCode}
                  onChangeText={(t) => setIfscCode(t.toUpperCase())}
                  placeholder="SBIN0001234"
                  placeholderTextColor="#A89F91"
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.saveBtn, loading && styles.saveBtnDisabled]} 
              onPress={handleSave} 
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>{t('saveChanges') || 'Save Profile Changes'}</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          /* View Mode */
          <View style={{ gap: 12 }}>
            <View style={styles.card}>
              <Text style={styles.sectionHeader}>👤 Personal KYC Details</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Mobile Number</Text>
                <Text style={styles.infoValue}>+91 {user.phone}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Region</Text>
                <Text style={styles.infoValue}>{user.region || 'Hubballi, Karnataka'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Aadhaar Card</Text>
                <Text style={styles.infoValueBold}>{maskAadhaar(user.aadhaar_number)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>PAN Card</Text>
                <Text style={styles.infoValueBold}>{maskPan(user.pan_card)}</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionHeader}>🏦 Bank & UPI Payout Details</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>UPI ID</Text>
                <Text style={styles.infoValueBold}>{user.upi_id || 'Not Set'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Bank Name</Text>
                <Text style={styles.infoValue}>{user.bank_name || 'Not Set'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Account Number</Text>
                <Text style={styles.infoValue}>
                  {user.account_number ? `•••• •••• ${String(user.account_number).slice(-4)}` : 'Not Set'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>IFSC Code</Text>
                <Text style={styles.infoValueBold}>{user.ifsc_code || 'Not Set'}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: 'rgba(250, 247, 242, 0.95)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(140, 109, 88, 0.25)',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#2A1E17',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#8C6D58',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  userName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#2A1E17',
  },
  verifiedPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  verifiedText: {
    color: '#065F46',
    fontSize: 9.5,
    fontWeight: '800',
  },
  userPhone: {
    fontSize: 11,
    color: '#6B5A4E',
    fontWeight: '600',
    marginTop: 1,
  },
  userRegion: {
    fontSize: 11,
    color: '#8C6D58',
    fontWeight: '700',
    marginTop: 1,
  },
  editBtn: {
    backgroundColor: 'rgba(140, 109, 88, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(140, 109, 88, 0.25)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  editBtnText: {
    color: '#8C6D58',
    fontSize: 11.5,
    fontWeight: '800',
  },
  statsBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(140, 109, 88, 0.15)',
    paddingTop: 12,
    marginTop: 14,
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(140, 109, 88, 0.2)',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6B5A4E',
  },
  statValue: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#8C6D58',
    marginTop: 2,
  },
  card: {
    backgroundColor: 'rgba(250, 247, 242, 0.95)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(140, 109, 88, 0.25)',
    padding: 16,
    shadowColor: '#2A1E17',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#8C6D58',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(140, 109, 88, 0.15)',
    marginVertical: 12,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#6B5A4E',
    marginTop: 6,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(140, 109, 88, 0.25)',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    height: 44,
    fontSize: 13.5,
    color: '#2A1E17',
    fontWeight: '600',
    marginBottom: 6,
  },
  saveBtn: {
    backgroundColor: '#8C6D58',
    borderRadius: 14,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#8C6D58',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(140, 109, 88, 0.1)',
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B5A4E',
  },
  infoValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#2A1E17',
  },
  infoValueBold: {
    fontSize: 13,
    fontWeight: '900',
    color: '#8C6D58',
  },
});
