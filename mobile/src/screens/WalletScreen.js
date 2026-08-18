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
      Alert.alert(t('missingPaymentProfile') || 'Missing Payout Details', t('missingPaymentMsg') || 'Please add UPI ID or Bank Account in your Profile tab before requesting payouts.');
      return;
    }

    if (hasUpi) setRedeemType('UPI');
    else setRedeemType('Bank');

    setRedeemPoints('');
    setModalVisible(true);
  };

  const pointsNum = parseInt(redeemPoints, 10) || 0;
  const currentBalance = stats.pointsBalance || 0;
  const remainingBalance = Math.max(0, currentBalance - pointsNum);

  const handlePresetSelect = (amount) => {
    const validAmount = Math.min(amount, currentBalance);
    setRedeemPoints(String(validAmount));
  };

  const submitRedeem = async () => {
    if (isNaN(pointsNum) || pointsNum <= 0) {
      Alert.alert(t('invalidAmount') || 'Invalid Amount', t('invalidAmountMsg') || 'Please enter a valid amount of points.');
      return;
    }
    if (pointsNum > currentBalance) {
      Alert.alert(t('insufficientBalance') || 'Insufficient Balance', t('insufficientMsg') || 'Requested points exceed available balance.');
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
          payoutType: redeemType,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setModalVisible(false);
        Alert.alert(
          t('requestSubmitted') || 'Payout Requested',
          `${t('payoutRequestFor') || 'Request for'} ₹${pointsNum} INR submitted. Funds will be transferred shortly.`
        );
        fetchPayouts();
        onRefreshStats();
      } else {
        Alert.alert(t('redeemFailed') || 'Request Failed', data.error || 'Failed to submit redemption request.');
      }
    } catch (error) {
      console.error('Redeem error:', error);
      Alert.alert(t('error') || 'Error', 'Network error while submitting payout request.');
    } finally {
      setRedeeming(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
      case 'Completed':
        return { bg: '#E6F4EA', text: '#065F46', border: '#A7F3D0' };
      case 'Rejected':
        return { bg: '#FEE2E2', text: '#B91C1C', border: '#FECACA' };
      default:
        return { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' };
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8C6D58']} />}
      >
        {/* Wallet Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>{t('availableBalance') || 'AVAILABLE BALANCE'}</Text>
              <View style={styles.pointsRow}>
                <Text style={styles.heroPoints}>{currentBalance.toLocaleString()}</Text>
                <Text style={styles.heroPointsSuffix}> Pts</Text>
              </View>
              <Text style={styles.heroInr}>
                {t('equivalentTo') || 'Value'}: ₹{currentBalance.toLocaleString()} INR (1 Pt = ₹1)
              </Text>
            </View>
            <View style={styles.walletIconCircle}>
              <Text style={styles.walletIconText}>💰</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.redeemBtn, currentBalance <= 0 && styles.redeemBtnDisabled]}
            onPress={handleRedeemClick}
            disabled={currentBalance <= 0}
          >
            <Text style={styles.redeemBtnText}>⚡ {t('redeemBtn') || 'REQUEST PAYOUT'}</Text>
          </TouchableOpacity>
        </View>

        {/* Payout History Section */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>{t('payoutHistory') || 'Payout History'}</Text>
            <Text style={styles.sectionSub}>All withdrawal and disbursal records</Text>
          </View>
          <TouchableOpacity onPress={onRefresh}>
            <Text style={styles.refreshBtn}>🔄 {t('pullRefresh') || 'Refresh'}</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color="#8C6D58" style={{ marginVertical: 20 }} />
        ) : payouts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>💳</Text>
            <Text style={styles.emptyTitle}>{t('noRedemptionHistory') || 'No redemptions yet'}</Text>
            <Text style={styles.emptySub}>{t('noRedemptionSubText') || 'Redeem your points to receive cash directly to your UPI/Bank'}</Text>
          </View>
        ) : (
          payouts.map((item) => {
            const badge = getStatusBadge(item.status);
            return (
              <View key={item.id} style={styles.payoutCard}>
                <View style={styles.payoutTop}>
                  <View style={styles.payoutTypeRow}>
                    <Text style={styles.typeIcon}>{item.payout_type === 'UPI' ? '⚡' : '🏦'}</Text>
                    <View>
                      <Text style={styles.payoutTitle}>{item.payout_type} Transfer</Text>
                      <Text style={styles.payoutId}>ID: {item.id} • {(item.created_at || '').split('T')[0]}</Text>
                    </View>
                  </View>

                  <View style={[styles.statusBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                    <Text style={[styles.statusText, { color: badge.text }]}>{item.status}</Text>
                  </View>
                </View>

                <View style={styles.payoutFooter}>
                  <Text style={styles.payoutPoints}>{item.points_redeemed || item.amount} Points</Text>
                  <Text style={styles.payoutAmount}>₹{item.amount} INR</Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Redeem Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{t('redeemPoints') || 'Redeem Points'}</Text>

            {/* Current Balance Summary */}
            <View style={styles.modalBalanceBox}>
              <View>
                <Text style={styles.modalBalanceLabel}>{t('availableBalance') || 'Available Balance'}</Text>
                <Text style={styles.modalBalanceValue}>{currentBalance.toLocaleString()} Pts</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.modalBalanceLabel}>After Payout</Text>
                <Text style={styles.modalRemainingValue}>{remainingBalance.toLocaleString()} Pts</Text>
              </View>
            </View>

            {/* Input */}
            <Text style={styles.modalInputLabel}>{t('enterPoints') || 'Enter points to redeem'}</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              placeholder="e.g. 500"
              placeholderTextColor="#A89F91"
              value={redeemPoints}
              onChangeText={(t) => setRedeemPoints(t.replace(/[^0-9]/g, ''))}
            />

            {/* Quick Presets */}
            <View style={styles.presetRow}>
              {[500, 1000, 2000].map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={[styles.presetBtn, amt > currentBalance && styles.presetBtnDisabled]}
                  onPress={() => handlePresetSelect(amt)}
                  disabled={amt > currentBalance}
                >
                  <Text style={styles.presetBtnText}>₹{amt}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.presetBtnMax}
                onPress={() => handlePresetSelect(currentBalance)}
              >
                <Text style={styles.presetBtnMaxText}>Max</Text>
              </TouchableOpacity>
            </View>

            {/* Payout Mode Selector */}
            <Text style={styles.modalInputLabel}>{t('choosePayoutMode') || 'Payout Mode'}</Text>
            <View style={styles.payoutModeCol}>
              {user.upi_id ? (
                <TouchableOpacity
                  style={[styles.modeCard, redeemType === 'UPI' && styles.modeCardActive]}
                  onPress={() => setRedeemType('UPI')}
                >
                  <Text style={styles.modeIcon}>⚡</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modeTitle}>Instant UPI</Text>
                    <Text style={styles.modeSub}>{user.upi_id}</Text>
                  </View>
                  {redeemType === 'UPI' && <Text style={styles.checkMark}>✓</Text>}
                </TouchableOpacity>
              ) : null}

              {user.account_number ? (
                <TouchableOpacity
                  style={[styles.modeCard, redeemType === 'Bank' && styles.modeCardActive]}
                  onPress={() => setRedeemType('Bank')}
                >
                  <Text style={styles.modeIcon}>🏦</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modeTitle}>{user.bank_name || 'Bank Transfer'}</Text>
                    <Text style={styles.modeSub}>•••• {String(user.account_number).slice(-4)}</Text>
                  </View>
                  {redeemType === 'Bank' && <Text style={styles.checkMark}>✓</Text>}
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Modal Actions */}
            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelText}>{t('cancel') || 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, (redeeming || pointsNum <= 0 || pointsNum > currentBalance) && styles.modalConfirmBtnDisabled]}
                onPress={submitRedeem}
                disabled={redeeming || pointsNum <= 0 || pointsNum > currentBalance}
              >
                {redeeming ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalConfirmText}>{t('confirmRedemption') || 'Confirm'}</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: 'rgba(250, 247, 242, 0.95)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(140, 109, 88, 0.25)',
    padding: 18,
    marginBottom: 16,
    shadowColor: '#2A1E17',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8C6D58',
    letterSpacing: 0.5,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 2,
  },
  heroPoints: {
    fontSize: 34,
    fontWeight: '900',
    color: '#2A1E17',
    letterSpacing: -0.5,
  },
  heroPointsSuffix: {
    fontSize: 18,
    fontWeight: '800',
    color: '#8C6D58',
  },
  heroInr: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  walletIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(140, 109, 88, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(140, 109, 88, 0.25)',
  },
  walletIconText: {
    fontSize: 22,
  },
  redeemBtn: {
    backgroundColor: '#8C6D58',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#8C6D58',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  redeemBtnDisabled: {
    opacity: 0.5,
  },
  redeemBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#8C6D58',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B5A4E',
    marginTop: 1,
  },
  refreshBtn: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8C6D58',
  },
  emptyCard: {
    backgroundColor: 'rgba(250, 247, 242, 0.95)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(140, 109, 88, 0.25)',
    padding: 28,
    alignItems: 'center',
    marginTop: 10,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2A1E17',
  },
  emptySub: {
    fontSize: 11,
    color: '#6B5A4E',
    textAlign: 'center',
    marginTop: 3,
  },
  payoutCard: {
    backgroundColor: 'rgba(250, 247, 242, 0.95)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(140, 109, 88, 0.25)',
    padding: 14,
    marginBottom: 10,
    shadowColor: '#2A1E17',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  payoutTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  payoutTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  typeIcon: {
    fontSize: 18,
  },
  payoutTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2A1E17',
  },
  payoutId: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#6B5A4E',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  payoutFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(140, 109, 88, 0.15)',
    paddingTop: 8,
  },
  payoutPoints: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#8C6D58',
  },
  payoutAmount: {
    fontSize: 14,
    fontWeight: '900',
    color: '#065F46',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FAF7F2',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(140, 109, 88, 0.3)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#2A1E17',
    marginBottom: 14,
    textAlign: 'center',
  },
  modalBalanceBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(140, 109, 88, 0.2)',
    marginBottom: 14,
  },
  modalBalanceLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#6B5A4E',
  },
  modalBalanceValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#2A1E17',
    marginTop: 2,
  },
  modalRemainingValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#B45309',
    marginTop: 2,
  },
  modalInputLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#6B5A4E',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(140, 109, 88, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 16,
    fontWeight: '800',
    color: '#2A1E17',
    marginBottom: 8,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  presetBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(140, 109, 88, 0.25)',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  presetBtnDisabled: {
    opacity: 0.4,
  },
  presetBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6B5A4E',
  },
  presetBtnMax: {
    flex: 1,
    backgroundColor: 'rgba(140, 109, 88, 0.15)',
    borderWidth: 1,
    borderColor: '#8C6D58',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  presetBtnMaxText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#8C6D58',
  },
  payoutModeCol: {
    gap: 8,
    marginBottom: 16,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(140, 109, 88, 0.25)',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  modeCardActive: {
    borderColor: '#8C6D58',
    backgroundColor: 'rgba(140, 109, 88, 0.1)',
  },
  modeIcon: {
    fontSize: 18,
  },
  modeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2A1E17',
  },
  modeSub: {
    fontSize: 11,
    color: '#8C6D58',
    fontWeight: '700',
  },
  checkMark: {
    fontSize: 16,
    fontWeight: '900',
    color: '#8C6D58',
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#374151',
  },
  modalConfirmBtn: {
    flex: 2,
    backgroundColor: '#8C6D58',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalConfirmBtnDisabled: {
    opacity: 0.6,
  },
  modalConfirmText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
