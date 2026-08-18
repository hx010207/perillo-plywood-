import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';

const TIER_CONFIG = {
  Member:   { icon: '📦', color: '#94A3B8', bg: '#F1F5F9', next: 100, rewardPct: 0.8 },
  Bronze:   { icon: '🥉', color: '#CD7F32', bg: '#FEF3C7', next: 400, rewardPct: 1.0 },
  Silver:   { icon: '🥈', color: '#6B7280', bg: '#F3F4F6', next: 700, rewardPct: 1.5 },
  Gold:     { icon: '🥇', color: '#F59E0B', bg: '#FEF9C3', next: 1000, rewardPct: 2.0 },
  Platinum: { icon: '💎', color: '#8B5CF6', bg: '#F3E8FF', next: null, rewardPct: 2.5 }
};

const MILESTONES = [
  { sheets: 100, gift: 'Branded utility item' },
  { sheets: 400, gift: 'Professional tool support gift' },
  { sheets: 700, gift: 'Premium tool kit or bonus reward' },
  { sheets: 1000, gift: 'Highest cashback slab / premium loyalty benefit' }
];

export default function DashboardScreen({ user, stats, apiUrl, onNavigateUpload, onViewLedgerItem, refreshKey, t = (key) => key }) {
  const [recentClaims, setRecentClaims] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecentClaims = async () => {
    try {
      const response = await fetch(`${apiUrl}/invoices/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setRecentClaims(data.slice(0, 3));
      }
    } catch (error) {
      console.warn('Error fetching recent claims:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRecentClaims();
    setRefreshing(false);
  };

  useEffect(() => {
    setLoading(true);
    fetchRecentClaims().finally(() => setLoading(false));
  }, [user.id, refreshKey]);

  useEffect(() => {
    fetchRecentClaims();
  }, [stats.pointsBalance, stats.pendingClaims]);

  const tierCfg = TIER_CONFIG[stats.tier] || TIER_CONFIG.Member;
  const totalSheets = stats.totalSheets || 0;
  const nextTierSheets = stats.nextTierSheets;
  const progressPct = nextTierSheets ? Math.min((totalSheets / nextTierSheets) * 100, 100) : 100;

  // Find next milestone
  const nextMilestone = MILESTONES.find(m => totalSheets < m.sheets);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Approved': return { bg: '#E6F4EA', text: '#137333' };
      case 'Rejected': return { bg: '#FCE8E6', text: '#C5221F' };
      default: return { bg: '#FEF7E0', text: '#B06000' };
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E4620']} />}
      >
        {/* Welcome + Verification */}
        <View style={styles.welcomeContainer}>
          <View style={styles.welcomeRow}>
            <View>
              <Text style={styles.welcomeText}>Namaste 👋</Text>
              <Text style={styles.carpenterName}>{user.name || 'User'}</Text>
            </View>
            {stats.verified ? (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓ Verified</Text>
              </View>
            ) : (
              <View style={styles.unverifiedBadge}>
                <Text style={styles.unverifiedText}>⏳ Pending</Text>
              </View>
            )}
          </View>
          <Text style={styles.carpenterId}>ID: {user.id}</Text>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>POINTS BALANCE</Text>
            <Text style={styles.balanceAmount}>{(stats.pointsBalance || 0).toLocaleString()} Pts</Text>
            <Text style={styles.balanceValue}>Value: ₹ {(stats.pointsBalance || 0).toLocaleString()}</Text>
          </View>
          <View style={[styles.tierBadge, { backgroundColor: tierCfg.bg }]}>
            <Text style={styles.tierIcon}>{tierCfg.icon}</Text>
            <Text style={[styles.tierName, { color: tierCfg.color }]}>{stats.tier}</Text>
            <Text style={[styles.tierReward, { color: tierCfg.color }]}>{tierCfg.rewardPct}%</Text>
          </View>
        </View>

        {/* Tier Progress Card */}
        <View style={styles.tierCard}>
          <View style={styles.tierHeader}>
            <Text style={styles.tierTitle}>{t('loyaltyProgress')}</Text>
            <Text style={styles.sheetCount}>{totalSheets} {t('sheets')} {t('total')}</Text>
          </View>
          
          {/* Progress bar */}
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPct}%`, backgroundColor: tierCfg.color }]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabelLeft}>{stats.tier} · {tierCfg.rewardPct}%</Text>
            {stats.nextTier ? (
              <Text style={styles.progressLabelRight}>{stats.nextTier} ({nextTierSheets} sheets)</Text>
            ) : (
              <Text style={styles.progressLabelRight}>{t('maxTierReached')}</Text>
            )}
          </View>

          {/* Next milestone gift */}
          {nextMilestone && (
            <View style={styles.milestoneHint}>
              <Text style={styles.milestoneText}>
                {t('nextMilestoneGift')} {nextMilestone.sheets} {t('sheets')}: {nextMilestone.gift}
              </Text>
            </View>
          )}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, styles.statBoxPending]}>
            <Text style={styles.statNumberPending}>{stats.pendingClaims}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={[styles.statBox, styles.statBoxApproved]}>
            <Text style={styles.statNumberApproved}>{stats.approvedClaims}</Text>
            <Text style={styles.statLabel}>Approved</Text>
          </View>
        </View>

        {/* Recent Claims */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('recentUploads')}</Text>
            <Text style={styles.pullText}>{t('pullRefresh')}</Text>
          </View>

          {loading ? (
            <ActivityIndicator color="#1E4620" size="small" style={{ marginTop: 20 }} />
          ) : recentClaims.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('noHistory')}</Text>
              <Text style={styles.emptySubText}>{t('uploadFirst')}</Text>
            </View>
          ) : (
            recentClaims.map((item) => {
              const statusTheme = getStatusStyle(item.status);
              const storeName = item.store_name || item.dealer_name || '';
              const dealerCity = item.dealer_city || '';
              const itemSummary = item.product_type || '';
              return (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.claimCard}
                  onPress={() => onViewLedgerItem(item)}
                >
                  <View style={styles.claimIconContainer}>
                    <Text style={styles.claimIcon}>📄</Text>
                  </View>
                  <View style={styles.claimDetails}>
                    <Text style={styles.claimDealer}>{storeName}</Text>
                    <Text style={styles.claimCity}>{dealerCity}</Text>
                    <Text style={styles.claimProduct} numberOfLines={1}>{itemSummary} • {item.quantity} Sheets</Text>
                    <Text style={styles.claimDate}>No: {item.invoice_number}</Text>
                  </View>
                  <View style={styles.claimRightSide}>
                    <View style={[styles.statusBadge, { backgroundColor: statusTheme.bg }]}>
                      <Text style={[styles.statusText, { color: statusTheme.text }]}>{item.status}</Text>
                    </View>
                    {item.status === 'Approved' && (
                      <Text style={styles.pointsEarnedText}>+{item.points_earned} Pts</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={onNavigateUpload}>
        <Text style={styles.fabIcon}>📷</Text>
        <Text style={styles.fabText}>{t('uploadInvoice')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 16, paddingBottom: 90 },
  welcomeContainer: { marginBottom: 16 },
  welcomeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  welcomeText: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  carpenterName: { fontSize: 22, fontWeight: 'bold', color: '#1E293B', marginTop: 2 },
  carpenterId: { fontSize: 12, color: '#94A3B8', fontWeight: '600', marginTop: 2 },
  verifiedBadge: { backgroundColor: '#DCFCE7', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: '#86EFAC' },
  verifiedText: { fontSize: 11, fontWeight: '700', color: '#166534' },
  unverifiedBadge: { backgroundColor: '#FEF9C3', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: '#FDE047' },
  unverifiedText: { fontSize: 11, fontWeight: '700', color: '#854D0E' },

  balanceCard: {
    backgroundColor: '#1E4620', borderRadius: 20, padding: 22,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: '#1E4620', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 4,
  },
  balanceInfo: { flex: 1 },
  balanceLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  balanceAmount: { color: '#FFFFFF', fontSize: 30, fontWeight: 'bold', marginTop: 4 },
  balanceValue: { color: '#FBBF24', fontSize: 13, fontWeight: '600', marginTop: 2 },
  tierBadge: { width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  tierIcon: { fontSize: 26 },
  tierName: { fontSize: 10, fontWeight: '800', marginTop: 2, textTransform: 'uppercase' },
  tierReward: { fontSize: 9, fontWeight: '800', marginTop: 2 },

  tierCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginTop: 14,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  tierHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  tierTitle: { fontSize: 14, fontWeight: 'bold', color: '#1E4620' },
  sheetCount: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  progressBarBg: { height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: 8, borderRadius: 4 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  progressLabelLeft: { fontSize: 11, fontWeight: '700', color: '#475569' },
  progressLabelRight: { fontSize: 11, fontWeight: '600', color: '#94A3B8' },
  milestoneHint: { marginTop: 10, backgroundColor: '#FFFBEB', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#FDE68A' },
  milestoneText: { fontSize: 12, color: '#92400E', fontWeight: '600' },

  statsGrid: { flexDirection: 'row', marginTop: 14, gap: 12 },
  statBox: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  statBoxPending: { borderLeftWidth: 4, borderLeftColor: '#D97706' },
  statBoxApproved: { borderLeftWidth: 4, borderLeftColor: '#10B981' },
  statNumberPending: { fontSize: 22, fontWeight: 'bold', color: '#D97706' },
  statNumberApproved: { fontSize: 22, fontWeight: 'bold', color: '#10B981' },
  statLabel: { fontSize: 11, color: '#64748B', marginTop: 3, fontWeight: '500' },

  recentSection: { marginTop: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E4620' },
  pullText: { fontSize: 11, color: '#94A3B8' },
  emptyContainer: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, padding: 24, alignItems: 'center', marginTop: 8 },
  emptyText: { fontSize: 14, color: '#475569', fontWeight: '600', textAlign: 'center' },
  emptySubText: { fontSize: 12, color: '#94A3B8', textAlign: 'center', marginTop: 6, lineHeight: 18 },

  claimCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  claimIconContainer: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  claimIcon: { fontSize: 18 },
  claimDetails: { flex: 1 },
  claimDealer: { fontSize: 14, fontWeight: 'bold', color: '#1E293B' },
  claimCity: { fontSize: 11, color: '#64748B', marginTop: 2, fontWeight: '600' },
  claimProduct: { fontSize: 12, color: '#64748B', marginTop: 2, fontWeight: '500' },
  claimDate: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  claimRightSide: { alignItems: 'flex-end' },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  pointsEarnedText: { fontSize: 12, color: '#1E4620', fontWeight: 'bold', marginTop: 4 },

  fab: {
    position: 'absolute', bottom: 14, left: 16, right: 16,
    backgroundColor: '#D97706', borderRadius: 14, height: 52,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#D97706', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  fabIcon: { fontSize: 18, marginRight: 8, color: '#FFFFFF' },
  fabText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', letterSpacing: 0.5 },
});
