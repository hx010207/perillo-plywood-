import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import { PerilloRewardsCard } from '../components/PerilloRewardsCard';

const MILESTONES = [
  { sheets: 100, gift: 'Branded Utility Item' },
  { sheets: 400, gift: 'Professional Tool Support Gift' },
  { sheets: 700, gift: 'Premium Tool Kit Bonus Reward' },
  { sheets: 1000, gift: 'Top-Tier Cashback & VIP Benefit' }
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
        setRecentClaims(data.slice(0, 4));
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

  const totalSheets = stats.totalSheets || 0;
  const nextTierSheets = stats.nextTierSheets || 100;
  const progressPct = nextTierSheets ? Math.min((totalSheets / nextTierSheets) * 100, 100) : 100;
  const nextMilestone = MILESTONES.find(m => totalSheets < m.sheets) || MILESTONES[0];
  const sheetsLeft = Math.max(0, nextMilestone.sheets - totalSheets);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
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
        {/* 1. Welcome Greeting Header with Circular Avatar */}
        <View style={styles.welcomeCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{(user.name || 'R').charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.welcomeMeta}>
              <Text style={styles.namasteLabel}>NAMASTE 🙏</Text>
              <Text style={styles.carpenterName}>{user.name || 'Raju Carpenter'}</Text>
              <Text style={styles.carpenterPhone}>
                {user.phone ? `+91 ${user.phone}` : `User ID: ${user.id}`}
              </Text>
            </View>
          </View>

          <View style={styles.badgeWrap}>
            {stats.verified ? (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓ Verified</Text>
              </View>
            ) : (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingText}>⏳ Pending</Text>
              </View>
            )}
          </View>
        </View>

        {/* 2. 4-Tier Rewards Card (Static Texture Assets) */}
        <PerilloRewardsCard
          userName={user.name}
          userId={user.id}
          pointsBalance={stats.pointsBalance}
          tier={stats.tier}
        />

        {/* 3. Loyalty Progress Tracker */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>🏆 {t('loyaltyProgress') || 'Loyalty Progress'}</Text>
            <Text style={styles.progressCounter}>
              {totalSheets} / {nextTierSheets} Sheets
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
          </View>

          {/* Milestone Banner */}
          {nextMilestone && (
            <View style={styles.milestoneBox}>
              <Text style={styles.milestoneText}>
                🎁 Next at <Text style={styles.bold}>{nextMilestone.sheets} Sheets</Text>: {nextMilestone.gift}
              </Text>
              <Text style={styles.sheetsLeftPill}>{sheetsLeft} LEFT</Text>
            </View>
          )}
        </View>

        {/* 4. KPI Triad */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>PENDING</Text>
            <Text style={[styles.kpiValue, { color: '#B45309' }]}>{stats.pendingClaims || 0}</Text>
            <Text style={styles.kpiSub}>Under Review</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>APPROVED</Text>
            <Text style={[styles.kpiValue, { color: '#065F46' }]}>{stats.approvedClaims || 0}</Text>
            <Text style={styles.kpiSub}>Credited</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>TOTAL SHEETS</Text>
            <Text style={[styles.kpiValue, { color: '#2A1E17' }]}>{totalSheets}</Text>
            <Text style={styles.kpiSub}>Lifetime</Text>
          </View>
        </View>

        {/* 5. Recent Uploads Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📄 {t('recentUploads') || 'Recent Invoices'}</Text>
          <TouchableOpacity onPress={onRefresh}>
            <Text style={styles.refreshLink}>{t('pullRefresh') || 'Refresh'}</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color="#8C6D58" style={{ marginVertical: 20 }} />
        ) : recentClaims.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📷</Text>
            <Text style={styles.emptyTitle}>{t('noHistory') || 'No claims submitted yet'}</Text>
            <Text style={styles.emptySub}>{t('uploadFirst') || 'Upload your first invoice to earn reward points'}</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={onNavigateUpload}>
              <Text style={styles.emptyBtnText}>{t('uploadInvoice') || 'Upload Invoice'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          recentClaims.map((item) => {
            const badge = getStatusBadge(item.status);
            return (
              <TouchableOpacity 
                key={item.id} 
                style={styles.claimCard}
                onPress={() => onViewLedgerItem(item)}
              >
                <View style={styles.claimTop}>
                  <Text style={styles.claimStore} numberOfLines={1}>
                    🏪 {item.store_name || item.dealer_name || 'Dealer Store'}
                  </Text>
                  <View style={[styles.statusPill, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                    <Text style={[styles.statusPillText, { color: badge.text }]}>{item.status}</Text>
                  </View>
                </View>

                <Text style={styles.claimProduct}>
                  {item.dealer_city ? `${item.dealer_city} • ` : ''}{item.product_type} ({item.quantity} Sheets)
                </Text>

                <View style={styles.claimFooter}>
                  <Text style={styles.claimDate}>
                    Inv #{item.invoice_number} · {item.purchase_date}
                  </Text>
                  {item.status === 'Approved' && (
                    <Text style={styles.claimPoints}>+{item.points_earned} Pts</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={onNavigateUpload} activeOpacity={0.9}>
        <Text style={styles.fabIcon}>📷</Text>
        <Text style={styles.fabText}>{t('uploadInvoice') || 'UPLOAD INVOICE'}</Text>
      </TouchableOpacity>
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
    paddingBottom: 90,
  },
  welcomeCard: {
    backgroundColor: 'rgba(250, 247, 242, 0.95)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(140, 109, 88, 0.25)',
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#2A1E17',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8C6D58',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  welcomeMeta: {
    justifyContent: 'center',
  },
  namasteLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8C6D58',
    letterSpacing: 1,
  },
  carpenterName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#2A1E17',
    marginTop: 1,
  },
  carpenterPhone: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B5A4E',
    marginTop: 1,
  },
  badgeWrap: {
    alignSelf: 'flex-start',
  },
  verifiedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  verifiedText: {
    color: '#065F46',
    fontSize: 10.5,
    fontWeight: '800',
  },
  pendingBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pendingText: {
    color: '#B45309',
    fontSize: 10.5,
    fontWeight: '800',
  },
  progressCard: {
    backgroundColor: 'rgba(250, 247, 242, 0.95)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(140, 109, 88, 0.25)',
    padding: 16,
    marginVertical: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2A1E17',
    textTransform: 'uppercase',
  },
  progressCounter: {
    fontSize: 13,
    fontWeight: '900',
    color: '#8C6D58',
  },
  progressBarTrack: {
    height: 10,
    backgroundColor: '#E7E2D9',
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#8C6D58',
    borderRadius: 999,
  },
  milestoneBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(140, 109, 88, 0.1)',
    borderRadius: 10,
    padding: 10,
  },
  milestoneText: {
    fontSize: 11,
    color: '#2A1E17',
    flex: 1,
  },
  bold: {
    fontWeight: '800',
  },
  sheetsLeftPill: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#8C6D58',
    backgroundColor: '#FAF7F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(140, 109, 88, 0.3)',
    marginLeft: 8,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 8,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: 'rgba(250, 247, 242, 0.95)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(140, 109, 88, 0.25)',
    padding: 12,
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#6B5A4E',
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '900',
    marginVertical: 4,
  },
  kpiSub: {
    fontSize: 9,
    color: '#8C6D58',
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#8C6D58',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  refreshLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B5A4E',
  },
  emptyCard: {
    backgroundColor: 'rgba(250, 247, 242, 0.95)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(140, 109, 88, 0.25)',
    padding: 24,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2A1E17',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 11,
    color: '#6B5A4E',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyBtn: {
    backgroundColor: '#8C6D58',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  emptyBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  claimCard: {
    backgroundColor: 'rgba(250, 247, 242, 0.95)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(140, 109, 88, 0.25)',
    padding: 14,
    marginBottom: 10,
  },
  claimTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  claimStore: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2A1E17',
    flex: 1,
    marginRight: 8,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  claimProduct: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#8C6D58',
    marginBottom: 6,
  },
  claimFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(140, 109, 88, 0.15)',
    paddingTop: 6,
  },
  claimDate: {
    fontSize: 10,
    color: '#6B5A4E',
    fontWeight: '600',
  },
  claimPoints: {
    fontSize: 12,
    fontWeight: '900',
    color: '#065F46',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#8C6D58',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 20,
    shadowColor: '#2A1E17',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  fabIcon: {
    fontSize: 16,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
