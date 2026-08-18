import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n';
import { 
  apiRequest, 
  fetchAdminCarpenters, 
  fetchAdminClaims, 
  fetchAdminPayouts,
  fetchPendingApprovals,
  approveCarpenter,
  rejectCarpenter,
  requestMoreInfo,
  suspendCarpenter,
  reactivateCarpenter
} from '../../services/api';

const tabs = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'approvals', label: 'Approvals' },
  { key: 'claims', label: 'Claims' },
  { key: 'carpenters', label: 'Users' },
  { key: 'tiers', label: 'Tiers' },
  { key: 'payouts', label: 'Payouts' },
  { key: 'settings', label: 'Settings' },
];

const loyaltyTiers = [
  { name: 'Member', range: '0 - 99', percent: '0.8%' },
  { name: 'Bronze', range: '100 - 399', percent: '1.0%' },
  { name: 'Silver', range: '400 - 699', percent: '1.5%' },
  { name: 'Gold', range: '700 - 999', percent: '2.0%' },
  { name: 'Platinum', range: '1000+', percent: '2.5%' },
];

const milestones = [
  { sheets: 100, gift: 'Branded utility kit' },
  { sheets: 400, gift: 'Premium tool support pack' },
  { sheets: 700, gift: 'Power tool bonus reward' },
  { sheets: 1000, gift: 'Top-tier loyalty benefit' },
];

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString();
}

function formatAmount(value) {
  const number = Number(value || 0);
  if (Number.isNaN(number)) return '0';
  return number.toLocaleString();
}

function normalizeImageUrls(item, baseUrl) {
  if (!item) return [];
  let paths = [];
  if (Array.isArray(item.image_urls) && item.image_urls.length > 0) {
    paths = item.image_urls;
  } else if (typeof item.image_urls === 'string' && item.image_urls.trim()) {
    try {
      const parsed = JSON.parse(item.image_urls);
      if (Array.isArray(parsed)) paths = parsed.filter(Boolean);
    } catch (error) {
      paths = item.image_urls.split(',').map((entry) => entry.trim()).filter(Boolean);
    }
  }
  if (!paths.length && item.image_url) paths = [item.image_url];

  // Resolve relative paths against the backend URL
  // baseUrl looks like "http://10.73.22.2:5000/api" — strip /api to get the server root
  const serverRoot = baseUrl ? baseUrl.replace(/\/api\/?$/, '') : '';
  return paths.map((p) => {
    if (!p) return '';
    if (p.startsWith('http://') || p.startsWith('https://')) return p;
    return `${serverRoot}${p.startsWith('/') ? '' : '/'}${p}`;
  }).filter(Boolean);
}

function StatCard({ label, value }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SectionTitle({ title, subtitle }) {
  return (
    <View style={styles.sectionTitleRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

export default function AdminShellScreen({ baseUrl }) {
  const { language, setLanguage, supportedLanguages } = useI18n();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claims, setClaims] = useState([]);
  const [carpenters, setCarpenters] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [selectedCarpenter, setSelectedCarpenter] = useState(null);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [busyActionId, setBusyActionId] = useState('');

  // Carpenter list filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadData = async () => {
    setRefreshing(true);
    try {
      const [claimsResult, carpentersResult, payoutsResult, pendingResult] = await Promise.all([
        fetchAdminClaims(baseUrl),
        fetchAdminCarpenters(baseUrl),
        fetchAdminPayouts(baseUrl),
        fetchPendingApprovals(baseUrl),
      ]);

      if (claimsResult.response.ok) {
        setClaims(Array.isArray(claimsResult.data) ? claimsResult.data : []);
      }
      if (carpentersResult.response.ok) {
        setCarpenters(Array.isArray(carpentersResult.data) ? carpentersResult.data : []);
      }
      if (payoutsResult.response.ok) {
        setPayouts(Array.isArray(payoutsResult.data) ? payoutsResult.data : []);
      }
      if (pendingResult.response.ok) {
        setPendingApprovals(Array.isArray(pendingResult.data) ? pendingResult.data : []);
      }
    } catch (error) {
      console.warn('Error loading admin data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const totalClaims = claims.length;
  const approvedClaims = claims.filter((item) => item.status === 'Approved').length;
  const pendingClaims = claims.filter((item) => item.status === 'Pending').length;
  const rejectedClaims = claims.filter((item) => item.status === 'Rejected').length;
  const totalCarpentersCount = carpenters.length;
  const pendingApprovalsCount = pendingApprovals.length;
  const verifiedCarpenters = carpenters.filter((item) => String(item.verified) === 'true' || item.verified === true).length;
  const pendingPayouts = payouts.filter((item) => item.status === 'Requested').length;
  const payoutTotals = payouts.filter((item) => item.status === 'Approved').reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const runClaimAction = async (claimId, action) => {
    setBusyActionId(`claim-${claimId}`);
    try {
      const { response, data } = await apiRequest(baseUrl, `/admin/claims/${claimId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, rejectionReason: action === 'Rejected' ? rejectionReason : '' }),
      });
      if (!response.ok) {
        throw new Error(data?.error || data?.message || 'Unable to update claim');
      }
      setSelectedClaim(null);
      setRejectionReason('');
      await loadData();
    } catch (error) {
      Alert.alert('Claims', error.message || 'Unable to update claim');
    } finally {
      setBusyActionId('');
    }
  };

  const runCarpenterAction = async (carpenterId, verified) => {
    setBusyActionId(`carpenter-${carpenterId}`);
    try {
      const { response, data } = await apiRequest(baseUrl, `/admin/carpenters/${carpenterId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified }),
      });
      if (!response.ok) {
        throw new Error(data?.error || data?.message || 'Unable to update carpenter');
      }
      await loadData();
      if (selectedCarpenter?.id === carpenterId) {
        setSelectedCarpenter({ ...selectedCarpenter, verified: verified ? 'true' : 'false' });
      }
    } catch (error) {
      Alert.alert('Carpenters', error.message || 'Unable to update carpenter');
    } finally {
      setBusyActionId('');
    }
  };

  const runApprovalAction = async (carpenterId, action) => {
    setBusyActionId(`approval-${carpenterId}`);
    try {
      let result;
      if (action === 'Approved') {
        result = await approveCarpenter(baseUrl, carpenterId);
      } else if (action === 'Rejected') {
        result = await rejectCarpenter(baseUrl, carpenterId);
      } else if (action === 'RequestInfo') {
        result = await requestMoreInfo(baseUrl, carpenterId);
      }

      if (!result.response.ok) {
        throw new Error(result.data?.error || result.data?.message || `Unable to ${action} carpenter`);
      }
      setSelectedCarpenter(null);
      await loadData();
    } catch (error) {
      Alert.alert('Approvals', error.message || `Unable to perform ${action}`);
    } finally {
      setBusyActionId('');
    }
  };

  const runSuspendAction = async (carpenterId, isSuspend) => {
    setBusyActionId(`suspend-${carpenterId}`);
    try {
      const result = isSuspend 
        ? await suspendCarpenter(baseUrl, carpenterId)
        : await reactivateCarpenter(baseUrl, carpenterId);
        
      if (!result.response.ok) {
        throw new Error(result.data?.error || result.data?.message || 'Unable to update carpenter status');
      }
      
      // Update selected carpenter state locally so modal reflects changes instantly
      if (selectedCarpenter && selectedCarpenter.id === carpenterId) {
        setSelectedCarpenter({
          ...selectedCarpenter,
          status: isSuspend ? 'suspended' : 'approved',
        });
      }
      await loadData();
    } catch (error) {
      Alert.alert('Carpenters', error.message || 'Unable to change carpenter status');
    } finally {
      setBusyActionId('');
    }
  };

  const runPayoutAction = async (payoutId, action) => {
    setBusyActionId(`payout-${payoutId}`);
    try {
      const { response, data } = await apiRequest(baseUrl, `/admin/payouts/${payoutId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!response.ok) {
        throw new Error(data?.error || data?.message || 'Unable to update payout');
      }
      setSelectedPayout(null);
      await loadData();
    } catch (error) {
      Alert.alert('Payouts', error.message || 'Unable to update payout');
    } finally {
      setBusyActionId('');
    }
  };
  const renderClaimLineItems = (claim) => {
    if (!claim) return null;
    let items = [];
    if (claim.line_items) {
      try {
        items = typeof claim.line_items === 'string' ? JSON.parse(claim.line_items) : claim.line_items;
      } catch (e) {
        console.warn('Error parsing line items:', e);
      }
    }
    
    if (!Array.isArray(items) || items.length === 0) {
      return (
        <View style={styles.lineItemsContainer}>
          <Text style={styles.lineItemsHeader}>Line Items:</Text>
          <View style={styles.lineItemRow}>
            <Text style={styles.lineItemText}>• {claim.product_type || '-'} × {claim.quantity || 0} sheets</Text>
          </View>
        </View>
      );
    }
    
    return (
      <View style={styles.lineItemsContainer}>
        <Text style={styles.lineItemsHeader}>Line Items:</Text>
        {items.map((it, idx) => (
          <View key={idx} style={styles.lineItemRow}>
            <Text style={styles.lineItemText}>• {it.product} × {it.quantity} sheets</Text>
          </View>
        ))}
        <Text style={styles.lineItemTotal}>Total: {claim.quantity} sheets</Text>
      </View>
    );
  };

  const renderCarpenterModalActions = () => {
    if (!selectedCarpenter) return null;
    const status = selectedCarpenter.status || 'pending_approval';
    const isVerified = String(selectedCarpenter.verified) === 'true' || selectedCarpenter.verified === true;

    return (
      <View style={styles.verticalActionsContainer}>
        {/* Verification Toggle */}
        <View style={styles.verificationRow}>
          <Text style={styles.verificationLabel}>Verification Status:</Text>
          <TouchableOpacity
            style={[styles.actionButton, isVerified ? styles.secondaryButton : styles.primaryButton, { flex: 1, paddingVertical: 10 }]}
            disabled={busyActionId.startsWith('carpenter-')}
            onPress={() => runCarpenterAction(selectedCarpenter.id, !isVerified)}
          >
            <Text style={styles.actionButtonText}>
              {isVerified ? 'Unverify Account' : 'Verify Account'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionsDivider} />

        {/* Approval Actions */}
        {status === 'pending_approval' && (
          <View style={styles.modalActionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.dangerButton, { flex: 1 }]}
              disabled={busyActionId.startsWith('approval-')}
              onPress={() => runApprovalAction(selectedCarpenter.id, 'Rejected')}
            >
              <Text style={styles.actionButtonText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.amberButton, { flex: 1.2 }]}
              disabled={busyActionId.startsWith('approval-')}
              onPress={() => runApprovalAction(selectedCarpenter.id, 'RequestInfo')}
            >
              <Text style={styles.actionButtonText}>Need Info</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.successButton, { flex: 1 }]}
              disabled={busyActionId.startsWith('approval-')}
              onPress={() => runApprovalAction(selectedCarpenter.id, 'Approved')}
            >
              <Text style={styles.actionButtonText}>Approve</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === 'more_info_requested' && (
          <View style={styles.moreInfoBox}>
            <Text style={styles.statusLabelText}>Status: Awaiting More Information</Text>
            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.dangerButton, { flex: 1 }]}
                disabled={busyActionId.startsWith('approval-')}
                onPress={() => runApprovalAction(selectedCarpenter.id, 'Rejected')}
              >
                <Text style={styles.actionButtonText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.successButton, { flex: 1 }]}
                disabled={busyActionId.startsWith('approval-')}
                onPress={() => runApprovalAction(selectedCarpenter.id, 'Approved')}
              >
                <Text style={styles.actionButtonText}>Approve</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {status === 'rejected' && (
          <View style={styles.moreInfoBox}>
            <Text style={styles.statusLabelTextRejected}>Status: Application Rejected</Text>
            <TouchableOpacity
              style={[styles.actionButton, styles.successButton]}
              disabled={busyActionId.startsWith('approval-')}
              onPress={() => runApprovalAction(selectedCarpenter.id, 'Approved')}
            >
              <Text style={styles.actionButtonText}>Re-approve Account</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === 'approved' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            disabled={busyActionId.startsWith('suspend-')}
            onPress={() => runSuspendAction(selectedCarpenter.id, true)}
          >
            <Text style={styles.actionButtonText}>Suspend Account</Text>
          </TouchableOpacity>
        )}

        {status === 'suspended' && (
          <View style={styles.moreInfoBox}>
            <Text style={styles.statusLabelTextSuspended}>Status: Account Suspended</Text>
            <TouchableOpacity
              style={[styles.actionButton, styles.successButton]}
              disabled={busyActionId.startsWith('suspend-')}
              onPress={() => runSuspendAction(selectedCarpenter.id, false)}
            >
              <Text style={styles.actionButtonText}>Reactivate Account</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#123a5a" />
          <Text style={styles.loadingText}>Loading admin data...</Text>
        </View>
      );
    }

    if (activeTab === 'dashboard') {
      return (
        <ScrollView contentContainerStyle={styles.sectionBody} showsVerticalScrollIndicator={false}>
          <View style={styles.gridRow}>
            <StatCard label="Total Claims" value={String(totalClaims)} />
            <StatCard label="Pending Claims" value={String(pendingClaims)} />
          </View>
          <View style={styles.gridRow}>
            <StatCard label="Total Users" value={String(totalCarpentersCount)} />
            <StatCard label="Pending Approvals" value={String(pendingApprovalsCount)} />
          </View>
          <View style={styles.gridRow}>
            <StatCard label="Pending Payouts" value={String(pendingPayouts)} />
            <StatCard label="Payout Totals" value={`₹${formatAmount(payoutTotals)}`} />
          </View>

          <SectionTitle title="Latest Claims" subtitle="Approve, reject, or inspect invoice images." />
          {claims.slice(0, 4).map((claim) => (
            <TouchableOpacity key={claim.id} style={styles.listCard} onPress={() => setSelectedClaim(claim)}>
              <View style={styles.listRowBetween}>
                <Text style={styles.listTitle}>{claim.carpenter_name || claim.carpenterName || 'User'}</Text>
                <Text style={[styles.badge, claim.status === 'Approved' ? styles.badgeGreen : claim.status === 'Rejected' ? styles.badgeRed : styles.badgeAmber]}>
                  {claim.status || 'Pending'}
                </Text>
              </View>
              <Text style={styles.listMeta}>{claim.store_name || claim.storeName || '-'} • {claim.dealer_city || claim.dealerCity || '-'}</Text>
              <Text style={styles.listMeta}>{normalizeImageUrls(claim, baseUrl).length} image(s) • {formatDate(claim.created_at)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      );
    }

    if (activeTab === 'approvals') {
      return (
        <FlatList
          contentContainerStyle={styles.sectionBody}
          data={pendingApprovals}
          keyExtractor={(item) => String(item.id)}
          refreshing={refreshing}
          onRefresh={loadData}
          ListHeaderComponent={
            <SectionTitle title="Pending Approvals" subtitle="Review and approve new carpenter signups." />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>🎉 No pending signups to review</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.listCard} onPress={() => setSelectedCarpenter(item)}>
              <View style={styles.listRowBetween}>
                <Text style={styles.listTitle}>{item.name || 'User'}</Text>
                <Text style={[styles.badge, styles.badgeAmber]}>
                  Pending
                </Text>
              </View>
              <Text style={styles.listMeta}>Phone: +91 {item.phone}</Text>
              <Text style={styles.listMeta}>Aadhaar: {item.aadhaar_number || '-'}</Text>
              <Text style={styles.listMeta}>Location: {item.city || '-'}, {item.state || '-'}</Text>
            </TouchableOpacity>
          )}
        />
      );
    }

    if (activeTab === 'claims') {
      return (
        <FlatList
          contentContainerStyle={styles.sectionBody}
          data={claims}
          keyExtractor={(item) => String(item.id)}
          refreshing={refreshing}
          onRefresh={loadData}
          ListHeaderComponent={
            <SectionTitle title="Claims Review" subtitle="Review invoices submitted from the app." />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No claims submitted yet</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.listCard} onPress={() => setSelectedClaim(item)}>
              <View style={styles.listRowBetween}>
                <Text style={styles.listTitle}>{item.store_name || item.storeName || 'Invoice'}</Text>
                <Text style={[styles.badge, item.status === 'Approved' ? styles.badgeGreen : item.status === 'Rejected' ? styles.badgeRed : styles.badgeAmber]}>
                  {item.status || 'Pending'}
                </Text>
              </View>
              <Text style={styles.listMeta}>{item.carpenter_name || item.carpenterName || '-'} • {item.dealer_city || item.dealerCity || '-'}</Text>
              <Text style={styles.listMeta}>Invoice #{item.invoice_number || item.invoiceNumber || '-'}</Text>
            </TouchableOpacity>
          )}
        />
      );
    }

    if (activeTab === 'carpenters') {
      const statusFilterChips = [
        { key: 'all', label: 'All' },
        { key: 'pending_approval', label: 'Pending' },
        { key: 'approved', label: 'Approved' },
        { key: 'more_info_requested', label: 'Need Info' },
        { key: 'rejected', label: 'Rejected' },
        { key: 'suspended', label: 'Suspended' },
      ];

      const filteredCarpenters = carpenters.filter((item) => {
        const query = searchQuery.trim().toLowerCase();
        const matchesSearch = !query || 
          (item.name || '').toLowerCase().includes(query) ||
          (item.phone || '').toLowerCase().includes(query) ||
          (item.id || '').toLowerCase().includes(query);

        const matchesStatus = statusFilter === 'all' || 
          (item.status || 'pending_approval') === statusFilter;

        return matchesSearch && matchesStatus;
      });

      return (
        <FlatList
          contentContainerStyle={styles.sectionBody}
          data={filteredCarpenters}
          keyExtractor={(item) => String(item.id)}
          refreshing={refreshing}
          onRefresh={loadData}
          ListHeaderComponent={
            <View style={styles.filterHeaderContainer}>
              <SectionTitle title="User Management" subtitle="Manage registered mobile users and credentials." />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name, phone, or ID..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                clearButtonMode="while-editing"
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chipsContainer}>
                {statusFilterChips.map((chip) => {
                  const isActive = statusFilter === chip.key;
                  return (
                    <TouchableOpacity
                      key={chip.key}
                      style={[styles.filterChip, isActive && styles.filterChipActive]}
                      onPress={() => setStatusFilter(chip.key)}
                    >
                      <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>{chip.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No matching carpenters found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.listCard} onPress={() => setSelectedCarpenter(item)}>
              <View style={styles.listRowBetween}>
                <Text style={styles.listTitle}>{item.name || 'User'}</Text>
                <Text style={[styles.badge, 
                  item.status === 'approved' ? styles.badgeGreen : 
                  item.status === 'rejected' ? styles.badgeRed : 
                  item.status === 'suspended' ? styles.badgeRed : 
                  styles.badgeAmber]}>
                  {(item.status || 'Pending').toUpperCase()}
                </Text>
              </View>
              <Text style={styles.listMeta}>{item.phone || '-'} • Verification: {String(item.verified) === 'true' || item.verified === true ? 'Verified ✓' : 'Unverified'}</Text>
              <Text style={styles.listMeta}>Tier {item.tier || 'Member'} • {item.total_sheets || 0} sheets</Text>
            </TouchableOpacity>
          )}
        />
      );
    }

    if (activeTab === 'tiers') {
      return (
        <ScrollView contentContainerStyle={styles.sectionBody} showsVerticalScrollIndicator={false}>
          <SectionTitle title="Loyalty Tiers" subtitle="Current reward slabs used by the backend." />
          {loyaltyTiers.map((tier) => (
            <View key={tier.name} style={styles.listCard}>
              <View style={styles.listRowBetween}>
                <Text style={styles.listTitle}>{tier.name}</Text>
                <Text style={styles.tierPercent}>{tier.percent}</Text>
              </View>
              <Text style={styles.listMeta}>{tier.range} sheets</Text>
            </View>
          ))}

          <SectionTitle title="Milestone Gifts" subtitle="Rewards shown to users at each milestone." />
          {milestones.map((milestone) => (
            <View key={String(milestone.sheets)} style={styles.listCard}>
              <Text style={styles.listTitle}>{milestone.sheets} sheets</Text>
              <Text style={styles.listMeta}>{milestone.gift}</Text>
            </View>
          ))}
        </ScrollView>
      );
    }

    if (activeTab === 'payouts') {
      return (
        <FlatList
          contentContainerStyle={styles.sectionBody}
          data={payouts}
          keyExtractor={(item) => String(item.id)}
          refreshing={refreshing}
          onRefresh={loadData}
          ListHeaderComponent={<SectionTitle title="Payouts" subtitle="Approve or reject redemption requests." />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No payout requests yet</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.listCard} onPress={() => setSelectedPayout(item)}>
              <View style={styles.listRowBetween}>
                <Text style={styles.listTitle}>{item.carpenter_name || item.carpenterName || 'User'}</Text>
                <Text style={[styles.badge, item.status === 'Approved' ? styles.badgeGreen : item.status === 'Rejected' ? styles.badgeRed : styles.badgeAmber]}>
                  {item.status || 'Requested'}
                </Text>
              </View>
              <Text style={styles.listMeta}>{formatAmount(item.points_redeemed)} points</Text>
              <Text style={styles.listMeta}>{item.carpenter_phone || item.carpenterPhone || '-'}</Text>
            </TouchableOpacity>
          )}
        />
      );
    }

    return (
      <ScrollView contentContainerStyle={styles.sectionBody} showsVerticalScrollIndicator={false}>
        <SectionTitle title="Settings" subtitle="App language and account controls." />
        <View style={styles.languageWrap}>
          {supportedLanguages.map((item) => (
            <TouchableOpacity
              key={item.code}
              style={[styles.languageChip, language === item.code && styles.languageChipActive]}
              onPress={() => setLanguage(item.code)}
            >
              <Text style={[styles.languageChipText, language === item.code && styles.languageChipTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.listCard}>
          <Text style={styles.listTitle}>Signed in as {user?.name || 'Admin'}</Text>
          <Text style={styles.listMeta}>{user?.email || user?.id || '-'}</Text>
        </View>
        <TouchableOpacity style={[styles.actionButton, styles.dangerButton]} onPress={logout}>
          <Text style={styles.actionButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>Perillo Plywood</Text>
          <Text style={styles.headerSubtitle}>Admin control center</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.adminLabel}>ADMIN</Text>
          <TouchableOpacity onPress={logout} style={styles.logoutPill}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity key={tab.key} style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]} onPress={() => setActiveTab(tab.key)}>
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {renderTabContent()}

      {/* Claim details modal */}
      <Modal visible={Boolean(selectedClaim)} transparent animationType="slide" onRequestClose={() => setSelectedClaim(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>{selectedClaim?.store_name || selectedClaim?.storeName || 'Claim details'}</Text>
              <Text style={styles.listMeta}>User: {selectedClaim?.carpenter_name || selectedClaim?.carpenterName || '-'}</Text>
              <Text style={styles.listMeta}>City: {selectedClaim?.dealer_city || selectedClaim?.dealerCity || '-'}</Text>
              <Text style={styles.listMeta}>Invoice #{selectedClaim?.invoice_number || selectedClaim?.invoiceNumber || '-'}</Text>
              <Text style={styles.listMeta}>Purchase Date: {selectedClaim?.purchase_date || '-'}</Text>
              <Text style={styles.listMeta}>Status: {selectedClaim?.status || '-'}</Text>
              {selectedClaim?.rejection_reason ? <Text style={[styles.listMeta, { color: '#EF4444' }]}>Rejection Reason: {selectedClaim.rejection_reason}</Text> : null}

              {renderClaimLineItems(selectedClaim)}

              <View style={styles.detailImageStrip}>
                {normalizeImageUrls(selectedClaim, baseUrl).map((imageUrl) => (
                  <Image key={imageUrl} source={{ uri: imageUrl }} style={styles.detailImage} resizeMode="contain" />
                ))}
              </View>

              {selectedClaim?.status === 'Pending' && (
                <>
                  <TextInput
                    value={rejectionReason}
                    onChangeText={setRejectionReason}
                    placeholder="Rejection reason (required for reject)"
                    style={styles.input}
                  />

                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.secondaryButton, { flex: 1 }]}
                      disabled={busyActionId === `claim-${selectedClaim?.id}`}
                      onPress={() => {
                        if (!rejectionReason.trim()) {
                          Alert.alert('Error', 'Please provide a rejection reason');
                          return;
                        }
                        runClaimAction(selectedClaim?.id, 'Rejected');
                      }}
                    >
                      <Text style={styles.actionButtonText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.successButton, { flex: 1.5 }]}
                      disabled={busyActionId === `claim-${selectedClaim?.id}`}
                      onPress={() => runClaimAction(selectedClaim?.id, 'Approved')}
                    >
                      <Text style={styles.actionButtonText}>Approve</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedClaim(null)}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Carpenter profile details modal */}
      <Modal visible={Boolean(selectedCarpenter)} transparent animationType="slide" onRequestClose={() => setSelectedCarpenter(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>{selectedCarpenter?.name || 'User'}</Text>
              <Text style={styles.listMeta}>ID: {selectedCarpenter?.id || '-'}</Text>
              <Text style={styles.listMeta}>Phone: +91 {selectedCarpenter?.phone || '-'}</Text>
              <Text style={styles.listMeta}>Email: {selectedCarpenter?.email || '-'}</Text>
              <Text style={styles.listMeta}>Aadhaar: {selectedCarpenter?.aadhaar_number || '-'}</Text>
              <Text style={styles.listMeta}>PAN Card: {selectedCarpenter?.pan_card || '-'}</Text>
              <Text style={styles.listMeta}>City: {selectedCarpenter?.city || '-'}</Text>
              <Text style={styles.listMeta}>State: {selectedCarpenter?.state || '-'}</Text>
              <Text style={styles.listMeta}>Preferred Language: {selectedCarpenter?.preferred_language?.toUpperCase() || '-'}</Text>
              <Text style={styles.listMeta}>Tier {selectedCarpenter?.tier || 'Member'} • {selectedCarpenter?.total_sheets || 0} sheets</Text>
              <Text style={styles.listMeta}>Points Balance: {selectedCarpenter?.points_balance || 0} pts</Text>

              <Text style={[styles.sectionTitle, { fontSize: 16, marginTop: 12, marginBottom: 4 }]}>Bank & UPI Settings</Text>
              <Text style={styles.listMeta}>UPI ID: {selectedCarpenter?.upi_id || '-'}</Text>
              <Text style={styles.listMeta}>Bank Name: {selectedCarpenter?.bank_name || '-'}</Text>
              <Text style={styles.listMeta}>Account No: {selectedCarpenter?.account_number || '-'}</Text>
              <Text style={styles.listMeta}>IFSC Code: {selectedCarpenter?.ifsc_code || '-'}</Text>

              {renderCarpenterModalActions()}

              <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedCarpenter(null)}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Payout details modal */}
      <Modal visible={Boolean(selectedPayout)} transparent animationType="slide" onRequestClose={() => setSelectedPayout(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Payout Request</Text>
              <Text style={styles.listMeta}>Carpenter: {selectedPayout?.carpenter_name || '-'}</Text>
              <Text style={styles.listMeta}>Phone: {selectedPayout?.carpenter_phone || '-'}</Text>
              <Text style={styles.listMeta}>Points Redeemed: {formatAmount(selectedPayout?.points_redeemed)} points</Text>
              <Text style={styles.listMeta}>Payout Amount: ₹ {formatAmount(selectedPayout?.amount)}</Text>
              <Text style={styles.listMeta}>Payout Mode: {selectedPayout?.payout_type || '-'}</Text>
              <Text style={styles.listMeta}>Request Date: {formatDate(selectedPayout?.created_at)}</Text>
              <Text style={styles.listMeta}>Status: {selectedPayout?.status || '-'}</Text>

              <Text style={[styles.sectionTitle, { fontSize: 16, marginTop: 12, marginBottom: 4 }]}>Transfer Accounts</Text>
              <Text style={styles.listMeta}>UPI ID: {selectedPayout?.upi_id || '-'}</Text>
              <Text style={styles.listMeta}>Bank: {selectedPayout?.bank_name || '-'}</Text>
              <Text style={styles.listMeta}>Account: {selectedPayout?.account_number || '-'}</Text>
              <Text style={styles.listMeta}>IFSC: {selectedPayout?.ifsc_code || '-'}</Text>

              {selectedPayout?.status === 'Requested' && (
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.secondaryButton, { flex: 1 }]}
                    disabled={busyActionId === `payout-${selectedPayout?.id}`}
                    onPress={() => runPayoutAction(selectedPayout?.id, 'Rejected')}
                  >
                    <Text style={styles.actionButtonText}>Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.successButton, { flex: 1.5 }]}
                    disabled={busyActionId === `payout-${selectedPayout?.id}`}
                    onPress={() => runPayoutAction(selectedPayout?.id, 'Approved')}
                  >
                    <Text style={styles.actionButtonText}>Mark Paid</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedPayout(null)}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f4f1ea',
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 58,
    paddingBottom: 16,
    backgroundColor: '#16324f',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    color: '#fff8e8',
    fontSize: 24,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#d6d0c4',
    marginTop: 4,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  adminLabel: {
    color: '#16324f',
    backgroundColor: '#f4c95d',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontWeight: '800',
  },
  logoutPill: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#f4f1ea',
  },
  tabItem: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#e7dfd3',
  },
  tabItemActive: {
    backgroundColor: '#16324f',
  },
  tabText: {
    color: '#4f4a41',
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#fff',
  },
  sectionBody: {
    padding: 16,
    paddingBottom: 120,
    gap: 12,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#4f4a41',
    fontSize: 15,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fffaf2',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eadfce',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#16324f',
  },
  statLabel: {
    marginTop: 6,
    color: '#635b52',
    fontWeight: '600',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#16324f',
  },
  sectionSubtitle: {
    color: '#72685c',
    marginTop: 4,
  },
  listCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eadfce',
    gap: 6,
  },
  listRowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#201a15',
  },
  listMeta: {
    color: '#6b6258',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    fontWeight: '800',
    overflow: 'hidden',
  },
  badgeGreen: {
    backgroundColor: '#def3df',
    color: '#1f6b37',
  },
  badgeRed: {
    backgroundColor: '#f7d7d7',
    color: '#a32222',
  },
  badgeAmber: {
    backgroundColor: '#f8e7bf',
    color: '#8a5a00',
  },
  tierPercent: {
    color: '#16324f',
    fontWeight: '800',
  },
  languageWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  languageChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#e7dfd3',
  },
  languageChipActive: {
    backgroundColor: '#16324f',
  },
  languageChipText: {
    color: '#51493f',
    fontWeight: '700',
  },
  languageChipTextActive: {
    color: '#fff',
  },
  actionButton: {
    backgroundColor: '#16324f',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#7b4d12',
  },
  dangerButton: {
    backgroundColor: '#9b2d2d',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(18, 22, 28, 0.55)',
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: {
    maxHeight: '88%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 18,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#16324f',
    marginBottom: 8,
  },
  detailImageStrip: {
    marginTop: 12,
    gap: 10,
  },
  detailImage: {
    width: '100%',
    height: 220,
    borderRadius: 18,
    backgroundColor: '#f1ece3',
  },
  input: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#d9d1c5',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#201a15',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  closeButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#16324f',
    fontWeight: '800',
  },
  searchInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eadfce',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#201a15',
    marginBottom: 8,
  },
  filterHeaderContainer: {
    gap: 8,
    marginBottom: 8,
  },
  chipsScroll: {
    marginVertical: 4,
  },
  chipsContainer: {
    gap: 8,
    paddingRight: 20,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#e7dfd3',
    borderWidth: 1,
    borderColor: '#eadfce',
  },
  filterChipActive: {
    backgroundColor: '#16324f',
    borderColor: '#16324f',
  },
  filterChipText: {
    color: '#4f4a41',
    fontWeight: '700',
    fontSize: 12,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#72685c',
    fontSize: 14,
    fontWeight: '600',
  },
  lineItemsContainer: {
    backgroundColor: '#fffaf2',
    borderWidth: 1,
    borderColor: '#eadfce',
    borderRadius: 14,
    padding: 12,
    marginVertical: 12,
    gap: 6,
  },
  lineItemsHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#16324f',
    marginBottom: 4,
  },
  lineItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lineItemText: {
    fontSize: 13,
    color: '#4f4a41',
    fontWeight: '500',
  },
  lineItemTotal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#16324f',
    marginTop: 4,
    textAlign: 'right',
  },
  verticalActionsContainer: {
    gap: 10,
    marginTop: 14,
  },
  verificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 10,
  },
  verificationLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4f4a41',
  },
  actionsDivider: {
    height: 1,
    backgroundColor: '#eadfce',
    marginVertical: 10,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  amberButton: {
    backgroundColor: '#D97706',
  },
  successButton: {
    backgroundColor: '#1E4620',
  },
  primaryButton: {
    backgroundColor: '#16324f',
  },
  statusLabelText: {
    fontSize: 13,
    color: '#D97706',
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  statusLabelTextRejected: {
    fontSize: 13,
    color: '#9b2d2d',
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  statusLabelTextSuspended: {
    fontSize: 13,
    color: '#9b2d2d',
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  moreInfoBox: {
    backgroundColor: '#fffaf2',
    borderWidth: 1,
    borderColor: '#eadfce',
    borderRadius: 14,
    padding: 12,
  },
});
