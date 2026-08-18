import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal, RefreshControl } from 'react-native';

export default function WalletScreen({ user, stats, apiUrl, onRefreshStats, t = (key) => key }) {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [redeemPoints, setRedeemPoints] = useState('');
  const [redeemType, setRedeemType] = useState('UPI');
  const [redeeming, setRedeeming] = useState(false);

  const fetchPayouts = async () => {
    try {
      const response = await fetch(`${apiUrl}/payouts/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setPayouts(data);
      }
    } catch (error) {
      console.warn('Error fetching payouts:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchPayouts(), onRefreshStats()]);
    setRefreshing(false);
  };

  useEffect(() => {
    setLoading(true);
    fetchPayouts().finally(() => setLoading(false));
  }, [user.id]);

  const handleRedeemClick = () => {
    const hasUpi = !!user.upi_id;
    const hasBank = !!(user.bank_name && user.account_number && user.ifsc_code);

    if (!hasUpi && !hasBank) {
      Alert.alert(t('missingPaymentProfile'), t('missingPaymentMsg'));
      return;
    }

    if (hasUpi) setRedeemType('UPI');
    else setRedeemType('Bank');

    setRedeemPoints('');
    setModalVisible(true);
  };

  const submitRedeem = async () => {
    const pointsNum = parseInt(redeemPoints, 10);
    if (isNaN(pointsNum) || pointsNum <= 0) {
      Alert.alert(t('invalidAmount'), t('invalidAmountMsg'));
      return;
    }
    if (pointsNum > (stats.pointsBalance || 0)) {
      Alert.alert(t('insufficientBalance'), t('insufficientMsg'));
      return;
    }
    if (redeemType === 'UPI' && !user.upi_id) {
      Alert.alert(t('missingUPI'), t('missingUPIMsg'));
      return;
    }
    if (redeemType === 'Bank' && (!user.bank_name || !user.account_number || !user.ifsc_code)) {
      Alert.alert(t('missingBank'), t('missingBankMsg'));
      return;
    }

    setRedeeming(true);
    try {
      const response = await fetch(`${apiUrl}/payouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carpenterId: user.id,
          points: pointsNum,
          payoutType: redeemType
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setModalVisible(false);
        Alert.alert(t('requestSubmitted'), `${t('payoutRequestFor')} ₹${pointsNum} ${t('submittedSoon')}`);
        onRefresh();
      } else {
        Alert.alert(t('requestFailed'), data.error || t('somethingWentWrong'));
      }
    } catch (err) {
      console.error('Redeem error:', err);
      Alert.alert(t('error'), t('connectionFailure'));
    } finally {
      setRedeeming(false);
    }
  };

  const getStatusStyle = (status) => {
    switch(status) {
      case 'Approved': return { bg: '#DCFCE7', text: '#166534' };
      case 'Rejected': return { bg: '#FEE2E2', text: '#991B1B' };
      default: return { bg: '#FEF9C3', text: '#854D0E' };
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E4620']} />}
      >
        {/* Balance Card */}
        <View style={styles.walletCard}>
          <Text style={styles.walletLabel}>{t('availableBalance')}</Text>
          <Text style={styles.walletPoints}>{(stats.pointsBalance || 0).toLocaleString()} Pts</Text>
          <Text style={styles.walletRupees}>{t('equivalentTo')} {(stats.pointsBalance || 0).toLocaleString()}</Text>

          <TouchableOpacity style={styles.redeemButton} onPress={handleRedeemClick}>
            <Text style={styles.redeemButtonText}>{t('redeemBtn')}</Text>
          </TouchableOpacity>
          <Text style={styles.redeemNote}>{t('payoutReviewNote')}</Text>
        </View>

        {/* History */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('payoutHistory')}</Text>
          <Text style={styles.pullText}>{t('pullRefresh')}</Text>
        </View>

        {loading ? (
          <ActivityIndicator color="#1E4620" size="small" style={{ marginTop: 20 }} />
        ) : payouts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('noRedemptionHistory')}</Text>
            <Text style={styles.emptySubText}>{t('noRedemptionSubText')}</Text>
          </View>
        ) : (
          payouts.map((item) => {
            const ss = getStatusStyle(item.status);
            return (
              <View key={item.id} style={styles.historyCard}>
                <View style={styles.historyIconBox}>
                  <Text style={styles.historyIcon}>{item.payout_type === 'UPI' ? '⚡' : '🏦'}</Text>
                </View>
                <View style={styles.historyDetails}>
                  <Text style={styles.historyTitle}>{t('redeemedVia')} {item.payout_type} — ₹{item.amount}</Text>
                  <Text style={styles.historyDate}>{(item.created_at || '').split('T')[0]}</Text>
                </View>
                <View style={[styles.historyStatusBadge, { backgroundColor: ss.bg }]}>
                  <Text style={[styles.historyStatusText, { color: ss.text }]}>{item.status}</Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Redeem Modal */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalPanel}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('redeemPoints')}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.balanceInfoText}>{t('balance')} {stats.pointsBalance || 0} Pts ({t('max')} {stats.pointsBalance || 0})</Text>
              
              <Text style={styles.modalInputLabel}>{t('enterPoints')}</Text>
              <TextInput
                style={styles.pointsInput}
                placeholder="e.g. 500"
                keyboardType="numeric"
                value={redeemPoints}
                onChangeText={setRedeemPoints}
              />

              <Text style={styles.modalInputLabel}>{t('choosePayoutMode')}</Text>
              <View style={styles.payoutModeRow}>
                {user.upi_id ? (
                  <TouchableOpacity 
                    style={[styles.modeSelector, redeemType === 'UPI' && styles.modeSelectorActive]}
                    onPress={() => setRedeemType('UPI')}
                  >
                    <Text style={styles.modeIcon}>⚡</Text>
                    <Text style={[styles.modeLabel, redeemType === 'UPI' && styles.modeLabelActive]}>UPI ({user.upi_id})</Text>
                  </TouchableOpacity>
                ) : null}

                {user.account_number ? (
                  <TouchableOpacity 
                    style={[styles.modeSelector, redeemType === 'Bank' && styles.modeSelectorActive]}
                    onPress={() => setRedeemType('Bank')}
                  >
                    <Text style={styles.modeIcon}>🏦</Text>
                    <Text style={[styles.modeLabel, redeemType === 'Bank' && styles.modeLabelActive]}>Bank (...{(user.account_number || '').slice(-4)})</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              <TouchableOpacity style={styles.confirmButton} onPress={submitRedeem} disabled={redeeming}>
                {redeeming ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.confirmButtonText}>{t('confirmRedemption')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 16 },

  walletCard: {
    backgroundColor: '#1E4620', borderRadius: 20, padding: 24, alignItems: 'center',
    shadowColor: '#1E4620', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 3,
  },
  walletLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' },
  walletPoints: { color: '#FFFFFF', fontSize: 38, fontWeight: 'bold', marginVertical: 6 },
  walletRupees: { color: '#FBBF24', fontSize: 14, fontWeight: '600', marginBottom: 18 },
  redeemButton: { backgroundColor: '#FFFFFF', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, width: '100%', alignItems: 'center' },
  redeemButtonText: { color: '#1E4620', fontSize: 15, fontWeight: 'bold' },
  redeemNote: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '500', marginTop: 8 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 12, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E4620' },
  pullText: { fontSize: 11, color: '#94A3B8' },
  emptyContainer: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, padding: 24, alignItems: 'center', marginTop: 6 },
  emptyText: { fontSize: 14, color: '#475569', fontWeight: '600', textAlign: 'center' },
  emptySubText: { fontSize: 12, color: '#94A3B8', textAlign: 'center', marginTop: 6, lineHeight: 18 },

  historyCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  historyIconBox: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  historyIcon: { fontSize: 18 },
  historyDetails: { flex: 1 },
  historyTitle: { fontSize: 14, fontWeight: 'bold', color: '#1E293B' },
  historyDate: { fontSize: 11, color: '#94A3B8', marginTop: 2, fontWeight: '500' },
  historyStatusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 },
  historyStatusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },

  // Modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalPanel: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 14 },
  modalTitle: { fontSize: 17, fontWeight: 'bold', color: '#1E4620' },
  closeBtn: { padding: 4 },
  closeBtnText: { fontSize: 20, color: '#94A3B8', fontWeight: '600' },
  modalBody: { paddingTop: 16 },
  balanceInfoText: { fontSize: 13, color: '#64748B', fontWeight: '600', marginBottom: 14 },
  modalInputLabel: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 8 },
  pointsInput: { borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 12, height: 48, fontSize: 16, paddingHorizontal: 14, color: '#1E293B', fontWeight: 'bold', marginBottom: 14 },
  payoutModeRow: { flexDirection: 'column', gap: 10, marginBottom: 20 },
  modeSelector: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 12, padding: 12, backgroundColor: '#F8FAFC' },
  modeSelectorActive: { borderColor: '#1E4620', backgroundColor: '#F0FDF4' },
  modeIcon: { fontSize: 18, marginRight: 10 },
  modeLabel: { fontSize: 13, color: '#475569', fontWeight: '600' },
  modeLabelActive: { color: '#1E4620' },
  confirmButton: { backgroundColor: '#1E4620', borderRadius: 12, height: 50, alignItems: 'center', justifyContent: 'center' },
  confirmButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },
});
