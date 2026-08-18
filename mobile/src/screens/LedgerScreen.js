import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Image } from 'react-native';

const buildImageUri = (apiUrl, imagePath) => {
  if (!imagePath) return '';
  return imagePath.startsWith('http') ? imagePath : `${apiUrl.replace('/api', '')}${imagePath}`;
};

const parseImageList = (item) => {
  if (!item) return [];
  if (Array.isArray(item.image_urls)) return item.image_urls;
  if (typeof item.image_urls === 'string' && item.image_urls.trim()) {
    try {
      const parsed = JSON.parse(item.image_urls);
      if (Array.isArray(parsed)) return parsed;
    } catch (error) {}
    return [item.image_urls];
  }
  return item.image_url ? [item.image_url] : [];
};

export default function LedgerScreen({ user, apiUrl, onViewItem, refreshKey, t = (key) => key }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInvoices = async () => {
    try {
      const response = await fetch(`${apiUrl}/invoices/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setInvoices(data);
      }
    } catch (error) {
      console.warn('Error fetching invoices:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInvoices();
    setRefreshing(false);
  };

  useEffect(() => {
    setLoading(true);
    fetchInvoices().finally(() => setLoading(false));
  }, [user.id, refreshKey]);

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

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator color="#8C6D58" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8C6D58']} />}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.screenTitle}>{t('claimsHistory') || 'Claims History'}</Text>
            <Text style={styles.screenSub}>All submitted invoices & reward status</Text>
          </View>
          <TouchableOpacity onPress={onRefresh}>
            <Text style={styles.refreshBtn}>🔄 {t('pullRefresh') || 'Refresh'}</Text>
          </TouchableOpacity>
        </View>

        {invoices.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>{t('noClaimsFound') || 'No claims on record'}</Text>
            <Text style={styles.emptySub}>{t('noClaimsSubText') || 'Upload invoices to start earning reward points'}</Text>
          </View>
        ) : (
          invoices.map((item) => {
            const badge = getStatusBadge(item.status);
            const storeName = item.store_name || item.dealer_name || 'Dealer Store';
            const dealerCity = item.dealer_city || '';

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.claimCard}
                onPress={() => onViewItem(item)}
                activeOpacity={0.8}
              >
                <View style={styles.claimHeader}>
                  <Text style={styles.claimId}>Claim #{item.id}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                    <Text style={[styles.statusText, { color: badge.text }]}>{item.status}</Text>
                  </View>
                </View>

                <Text style={styles.storeName}>🏪 {storeName}</Text>
                {dealerCity ? <Text style={styles.cityName}>📍 {dealerCity}</Text> : null}
                <Text style={styles.productType}>{item.product_type}</Text>

                <View style={styles.claimFooter}>
                  <View>
                    <Text style={styles.quantityText}>{item.quantity} Sheets</Text>
                    <Text style={styles.metaText}>Inv #{item.invoice_number} • {item.purchase_date}</Text>
                  </View>

                  {item.status === 'Approved' && (
                    <Text style={styles.pointsText}>+{item.points_earned} Pts</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

// Sub-component for Details Screen
LedgerScreen.Detail = function LedgerDetail({ item, apiUrl, t = (key) => key }) {
  const images = parseImageList(item).map((path) => buildImageUri(apiUrl, path)).filter(Boolean);
  let lineItems = [];
  if (item.line_items) {
    try {
      lineItems = typeof item.line_items === 'string' ? JSON.parse(item.line_items) : item.line_items;
    } catch (e) {}
  }

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

  const badge = getStatusBadge(item.status);

  return (
    <ScrollView contentContainerStyle={styles.detailScrollContent}>
      {/* Attached Invoice Images */}
      {images.length > 0 && (
        <View style={styles.imageGallery}>
          <Image source={{ uri: images[0] }} style={styles.mainImage} resizeMode="contain" />
          {images.length > 1 && (
            <ScrollView horizontal style={styles.thumbRow}>
              {images.map((uri, idx) => (
                <Image key={idx} source={{ uri }} style={styles.thumbImage} />
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {/* Details Box */}
      <View style={styles.card}>
        <View style={styles.claimHeader}>
          <View>
            <Text style={styles.metaText}>Claim ID</Text>
            <Text style={styles.detailId}>{item.id}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
            <Text style={[styles.statusText, { color: badge.text }]}>{item.status}</Text>
          </View>
        </View>

        {item.status === 'Rejected' && item.rejection_reason && (
          <View style={styles.rejectionBox}>
            <Text style={styles.rejectionTitle}>⚠️ Rejection Reason</Text>
            <Text style={styles.rejectionText}>{item.rejection_reason}</Text>
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Dealer Store</Text>
          <Text style={styles.infoValue}>{item.store_name || item.dealer_name || '-'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>City / Location</Text>
          <Text style={styles.infoValue}>{item.dealer_city || '-'}</Text>
        </View>

        {lineItems.length > 0 ? (
          <View style={styles.lineItemsDetailBox}>
            <Text style={styles.infoLabel}>Line Items</Text>
            {lineItems.map((li, idx) => (
              <View key={idx} style={styles.lineItemRow}>
                <Text style={styles.liProduct}>{li.product}</Text>
                <Text style={styles.liQty}>× {li.quantity} Sheets</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Product Grade</Text>
            <Text style={styles.infoValue}>{item.product_type}</Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Total Quantity</Text>
          <Text style={styles.infoValueBold}>{item.quantity} Sheets</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Invoice Number</Text>
          <Text style={styles.infoValue}>{item.invoice_number}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Purchase Date</Text>
          <Text style={styles.infoValue}>{item.purchase_date}</Text>
        </View>

        {item.status === 'Approved' && (
          <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: 'rgba(140, 109, 88, 0.2)', paddingTop: 10, marginTop: 4 }]}>
            <Text style={styles.pointsEarnedLabel}>Points Credited</Text>
            <Text style={styles.pointsEarnedValue}>+{item.points_earned} Pts</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF7F2',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2A1E17',
  },
  screenSub: {
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
    padding: 30,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2A1E17',
  },
  emptySub: {
    fontSize: 11.5,
    color: '#6B5A4E',
    textAlign: 'center',
    marginTop: 4,
  },
  claimCard: {
    backgroundColor: 'rgba(250, 247, 242, 0.95)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(140, 109, 88, 0.25)',
    padding: 14,
    marginBottom: 10,
    shadowColor: '#2A1E17',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  claimHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  claimId: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B5A4E',
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
  storeName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#2A1E17',
  },
  cityName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B5A4E',
    marginTop: 1,
  },
  productType: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8C6D58',
    marginTop: 4,
  },
  claimFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: 'rgba(140, 109, 88, 0.15)',
    paddingTop: 8,
    marginTop: 8,
  },
  quantityText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#2A1E17',
  },
  metaText: {
    fontSize: 10.5,
    color: '#6B5A4E',
    fontWeight: '600',
    marginTop: 1,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#065F46',
  },
  detailScrollContent: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: '#FAF7F2',
  },
  imageGallery: {
    backgroundColor: '#000000',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(140, 109, 88, 0.3)',
  },
  mainImage: {
    width: '100%',
    height: 240,
    backgroundColor: '#111827',
  },
  thumbRow: {
    padding: 8,
    backgroundColor: '#1E293B',
  },
  thumbImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
  },
  card: {
    backgroundColor: 'rgba(250, 247, 242, 0.95)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(140, 109, 88, 0.25)',
    padding: 16,
  },
  detailId: {
    fontSize: 16,
    fontWeight: '900',
    color: '#2A1E17',
    marginTop: 1,
  },
  rejectionBox: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 10,
    marginVertical: 10,
  },
  rejectionTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#B91C1C',
  },
  rejectionText: {
    fontSize: 11,
    color: '#7F1D1D',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(140, 109, 88, 0.15)',
    marginVertical: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
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
  lineItemsDetailBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(140, 109, 88, 0.2)',
  },
  lineItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  liProduct: {
    fontSize: 11.5,
    color: '#2A1E17',
    fontWeight: '700',
  },
  liQty: {
    fontSize: 11.5,
    color: '#8C6D58',
    fontWeight: '800',
  },
  pointsEarnedLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: '#065F46',
  },
  pointsEarnedValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#065F46',
  },
});
