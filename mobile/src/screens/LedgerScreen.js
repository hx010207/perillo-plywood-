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

  const getStatusTheme = (status) => {
    switch (status) {
      case 'Approved': return { bg: '#10B981', color: '#FFFFFF' };
      case 'Rejected': return { bg: '#EF4444', color: '#FFFFFF' };
      default: return { bg: '#F59E0B', color: '#FFFFFF' };
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator color="#1E4620" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E4620']} />}
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>{t('claimsHistory')}</Text>
          <Text style={styles.pullText}>{t('pullRefresh')}</Text>
        </View>

        {invoices.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('noClaimsFound')}</Text>
            <Text style={styles.emptySubText}>{t('noClaimsSubText')}</Text>
          </View>
        ) : (
          invoices.map((item) => {
            const theme = getStatusTheme(item.status);
            const storeName = item.store_name || item.dealer_name || '-';
            const dealerCity = item.dealer_city || '-';
            const itemSummary = item.product_type || '-';
            return (
              <TouchableOpacity key={item.id} style={styles.card} onPress={() => onViewItem(item)}>
                <View style={styles.cardTop}>
                  <Text style={styles.trackingId}>{item.id}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: theme.bg }]}>
                    <Text style={[styles.statusText, { color: theme.color }]}>{item.status}</Text>
                  </View>
                </View>

                <Text style={styles.storeText}>🏪 {storeName}</Text>
                <Text style={styles.cityText}>{dealerCity}</Text>
                <Text style={styles.itemsText} numberOfLines={1}>{itemSummary}</Text>
                
                <View style={styles.cardBottom}>
                  <View>
                    <Text style={styles.sheetText}>{item.quantity} {t('sheets')}</Text>
                    <Text style={styles.dateText}>{t('invoiceNo')} {item.invoice_number} • {item.purchase_date}</Text>
                  </View>
                  {item.status === 'Approved' && (
                    <Text style={styles.ptsText}>+{item.points_earned} Pts</Text>
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

// Detail subcomponent
LedgerScreen.Detail = function LedgerDetail({ item, apiUrl, t = (key) => key }) {
  const getStatusTheme = (status) => {
    switch (status) {
      case 'Approved': return { bg: '#E6F4EA', text: '#137333' };
      case 'Rejected': return { bg: '#FCE8E6', text: '#C5221F' };
      default: return { bg: '#FEF7E0', text: '#B06000' };
    }
  };

  const statusTheme = getStatusTheme(item.status);
  const images = parseImageList(item).map((imagePath) => buildImageUri(apiUrl, imagePath)).filter(Boolean);
  
  const storeName = item.store_name || item.dealer_name || '-';
  const dealerCity = item.dealer_city || '-';

  // Parse line items
  let lineItems = [];
  try { lineItems = JSON.parse(item.line_items || '[]'); } catch(e) {}

  return (
    <ScrollView style={styles.detailScroll} contentContainerStyle={styles.detailScrollContent}>
      {/* Image */}
      <View style={styles.imageGalleryContainer}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: images[0] || '' }} style={styles.detailImage} resizeMode="cover" />
          <View style={styles.imageOverlay}>
            <Text style={styles.imageOverlayText}>{t('submittedAttachment')}</Text>
          </View>
        </View>
        {images.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailScroll} contentContainerStyle={styles.thumbnailScrollContent}>
            {images.map((uri, index) => (
              <Image key={`${uri}-${index}`} source={{ uri }} style={styles.thumbnailImage} resizeMode="cover" />
            ))}
          </ScrollView>
        )}
        {!images.length && (
          <View style={styles.noImageBox}>
            <Text style={styles.noImageText}>{t('none')}</Text>
          </View>
        )}
      </View>

      {/* Details Card */}
      <View style={styles.detailCard}>
        <View style={styles.detailCardHeader}>
          <Text style={styles.detailId}>{item.id}</Text>
          <View style={[styles.detailStatusBadge, { backgroundColor: statusTheme.bg }]}>
            <Text style={[styles.detailStatusText, { color: statusTheme.text }]}>{item.status}</Text>
          </View>
        </View>

        {item.status === 'Rejected' && (
          <View style={styles.rejectionBanner}>
            <Text style={styles.rejectionTitle}>{t('rejectionReason')}</Text>
            <Text style={styles.rejectionBody}>{item.rejection_reason || 'Verification failed'}</Text>
          </View>
        )}

        <View style={styles.divider} />

        {renderDetailField(t('dealerName'), storeName)}
        {renderDetailField(t('dealerCityLabel'), dealerCity)}
        
        {/* Line items */}
        {lineItems.length > 0 ? (
          <View style={styles.lineItemsSection}>
            <Text style={styles.lineItemsSectionTitle}>{t('lineItems')}</Text>
            {lineItems.map((li, idx) => (
              <View key={idx} style={styles.lineItemRow}>
                <Text style={styles.lineItemProduct}>{li.product}</Text>
                <Text style={styles.lineItemQty}>×{li.quantity}</Text>
              </View>
            ))}
          </View>
        ) : (
          renderDetailField(t('productType'), item.product_type)
        )}

        {renderDetailField(t('quantity'), `${item.quantity}`)}
        {renderDetailField(t('invoiceNumber'), item.invoice_number)}
        {renderDetailField(t('purchaseDate'), item.purchase_date)}
        {renderDetailField(t('qrCode'), item.qr_code || t('none'))}
        {item.status === 'Approved' && renderDetailField(t('pointsEarned'), `+${item.points_earned} Pts`, '#1E4620')}
      </View>
    </ScrollView>
  );
};

function renderDetailField(label, value, valueColor = '#1E293B') {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={[styles.fieldValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title: { fontSize: 17, fontWeight: 'bold', color: '#1E4620' },
  pullText: { fontSize: 11, color: '#94A3B8' },
  emptyContainer: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, padding: 28, alignItems: 'center', marginTop: 16 },
  emptyText: { fontSize: 15, color: '#475569', fontWeight: 'bold' },
  emptySubText: { fontSize: 12, color: '#94A3B8', textAlign: 'center', marginTop: 8, lineHeight: 18 },

  card: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  trackingId: { fontSize: 14, fontWeight: 'bold', color: '#1E293B' },
  statusBadge: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  storeText: { fontSize: 14, color: '#334155', fontWeight: '600' },
  itemsText: { fontSize: 12, color: '#64748B', fontWeight: '500', marginTop: 2 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  sheetText: { fontSize: 13, color: '#1E4620', fontWeight: 'bold' },
  dateText: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  ptsText: { fontSize: 14, color: '#1E4620', fontWeight: 'bold' },
  cityText: { fontSize: 11, color: '#64748B', marginTop: 2, fontWeight: '600' },

  // Detail styles
  detailScroll: { flex: 1, backgroundColor: '#F8FAFC' },
  detailScrollContent: { padding: 16 },
  imageGalleryContainer: { marginBottom: 16 },
  imageContainer: { height: 200, width: '100%', borderRadius: 14, overflow: 'hidden', backgroundColor: '#E2E8F0', borderWidth: 1, borderColor: '#CBD5E1', position: 'relative' },
  detailImage: { width: '100%', height: '100%' },
  imageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(30,70,32,0.75)', paddingVertical: 6, paddingHorizontal: 12 },
  imageOverlayText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold', textAlign: 'center' },
  thumbnailScroll: { marginTop: 10 },
  thumbnailScrollContent: { gap: 8 },
  thumbnailImage: { width: 72, height: 72, borderRadius: 10, borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#E2E8F0' },
  noImageBox: { height: 160, borderRadius: 14, borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  noImageText: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
  detailCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 18, borderWidth: 1, borderColor: '#E2E8F0' },
  detailCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  detailId: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  detailStatusBadge: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 8 },
  detailStatusText: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  rejectionBanner: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FCA5A5', borderRadius: 10, padding: 12, marginBottom: 14 },
  rejectionTitle: { fontSize: 11, fontWeight: '700', color: '#991B1B' },
  rejectionBody: { fontSize: 12, color: '#B91C1C', marginTop: 3, fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 10 },

  lineItemsSection: { marginVertical: 8, backgroundColor: '#F8FAFC', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  lineItemsSectionTitle: { fontSize: 11, fontWeight: '700', color: '#475569', marginBottom: 8, textTransform: 'uppercase' },
  lineItemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  lineItemProduct: { fontSize: 13, color: '#334155', fontWeight: '500' },
  lineItemQty: { fontSize: 13, fontWeight: 'bold', color: '#1E4620' },

  fieldRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  fieldLabel: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  fieldValue: { fontSize: 13, fontWeight: '600' },
});
