import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { useI18n } from '../i18n';

const PRODUCT_TYPES = ['Perillo Pro', 'Perillo Star', 'Perillo Club', 'Perillo Shuttering Plywood'];

const normalizeUploadUri = (uri) => (Platform.OS === 'ios' && uri.startsWith('file://') ? uri.replace('file://', '') : uri);

export default function UploadInvoiceScreen({ user, apiUrl, onBack }) {
  const { t } = useI18n();
  const [images, setImages] = useState([]);
  const [storeName, setStoreName] = useState('');
  const [dealerCity, setDealerCity] = useState('');
  const [lineItems, setLineItems] = useState([{ product: '', quantity: '' }]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toLocaleDateString('en-IN'));
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);

  const addLineItem = () => {
    setLineItems([...lineItems, { product: '', quantity: '' }]);
  };

  const removeLineItem = (index) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index, field, value) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const totalSheets = lineItems.reduce((sum, item) => {
    const qty = parseInt(item.quantity, 10);
    return sum + (isNaN(qty) ? 0 : qty);
  }, 0);

  const addPickedImages = (pickedUris) => {
    if (!pickedUris.length) return;
    setImages((current) => {
      const merged = [...current];
      pickedUris.forEach((uri) => {
        if (uri && !merged.includes(uri)) merged.push(uri);
      });
      return merged;
    });
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('permissionDenied'), t('cameraPermission'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      addPickedImages([result.assets[0].uri]);
    }
  };

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('permissionDenied'), t('galleryPermission'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      addPickedImages(result.assets.map((asset) => asset.uri));
    }
  };

  const removeImage = (uri) => {
    setImages((current) => current.filter((item) => item !== uri));
  };

  const moveImage = (index, direction) => {
    const newImages = [...images];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newImages.length) return;
    
    const temp = newImages[index];
    newImages[index] = newImages[targetIndex];
    newImages[targetIndex] = temp;
    setImages(newImages);
  };

  const handleSubmit = async () => {
    if (images.length === 0) { Alert.alert(t('photoRequired'), t('photoRequiredMsg')); return; }
    if (!storeName.trim()) { Alert.alert(t('error'), t('dealerNameRequired')); return; }
    if (!dealerCity.trim()) { Alert.alert(t('error'), t('dealerCityRequired')); return; }
    
    // Validate line items
    for (let i = 0; i < lineItems.length; i++) {
      if (!lineItems[i].product) {
        Alert.alert(t('error'), `${t('selectProduct')} ${i + 1}.`);
        return;
      }
      const qty = parseInt(lineItems[i].quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        Alert.alert(t('error'), `${t('invalidQty')} ${i + 1}.`);
        return;
      }
    }
    if (!invoiceNumber.trim()) { Alert.alert(t('error'), t('enterInvoiceNo')); return; }

    setLoading(true);
    try {
      const formData = new FormData();

      images.forEach((uri, index) => {
        const filename = uri.split('/').pop() || `invoice-${index + 1}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        formData.append('images', {
          uri: normalizeUploadUri(uri),
          name: filename,
          type,
        });
      });

      formData.append('carpenterId', user.id);
      formData.append('storeName', storeName.trim());
      formData.append('dealerCity', dealerCity.trim());
      formData.append('lineItems', JSON.stringify(lineItems.map(li => ({
        product: li.product,
        quantity: parseInt(li.quantity, 10)
      }))));
      formData.append('invoiceNumber', invoiceNumber);
      formData.append('purchaseDate', purchaseDate);
      formData.append('qrCode', qrCode);

      const response = await fetch(`${apiUrl}/invoices`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (response.ok && data.success) {
        Alert.alert(
          t('invoiceSubmitted'),
          `${t('invoiceSubmittedMsg')} ${data.trackingId}\n${t('totalSheetsLabel')}: ${totalSheets}\n${t('pendingReview')}`,
          [{ text: t('ok'), onPress: onBack }]
        );
      } else {
        Alert.alert(t('uploadFailed'), data.error || t('uploadFailedMsg'));
      }
    } catch (err) {
      console.error('Invoice upload error:', err);
      Alert.alert(t('uploadErrorTitle'), t('uploadError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>{t('back')}</Text>
          </TouchableOpacity>
          <Text style={styles.topTitle}>{t('newClaim')}</Text>
          <View style={{ width: 50 }} />
        </View>

        {/* Image picker */}
        <View style={styles.imageSelectorBox}>
          {images.length === 0 ? (
            <View style={styles.placeholderContainer}>
              <Feather name="upload-cloud" size={40} color="#94A3B8" />
              <Text style={styles.uploadTitle}>{t('uploadInvoiceReceipt')}</Text>
              <Text style={styles.uploadSub}>{t('imageMustBeClear')}</Text>
              <View style={styles.pickerButtonRow}>
                <TouchableOpacity style={styles.pickerBtn} onPress={takePhoto}>
                  <Feather name="camera" size={16} color="#FFFFFF" style={styles.pickerBtnIconVector} />
                  <Text style={styles.pickerBtnText}>{t('camera')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.pickerBtn} onPress={pickImages}>
                  <Feather name="image" size={16} color="#FFFFFF" style={styles.pickerBtnIconVector} />
                  <Text style={styles.pickerBtnText}>{t('gallery')}</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.uploadHint}>{t('multipleImageHint')}</Text>
            </View>
          ) : (
            <View>
              <View style={styles.previewGrid}>
                {images.map((uri, index) => (
                  <View key={uri} style={styles.previewCard}>
                    <Image source={{ uri }} style={styles.imagePreview} resizeMode="cover" />
                    <View style={styles.imageActionRow}>
                      <TouchableOpacity 
                        style={[styles.moveBtn, index === 0 && styles.moveBtnDisabled]} 
                        onPress={() => moveImage(index, -1)}
                        disabled={index === 0}
                      >
                        <Feather name="chevron-left" size={20} color={index === 0 ? "#CBD5E1" : "#64748B"} />
                      </TouchableOpacity>
                      
                      <TouchableOpacity style={styles.clearBtn} onPress={() => removeImage(uri)}>
                        <Feather name="trash-2" size={14} color="#EF4444" style={{marginRight: 4}} />
                        <Text style={styles.clearBtnText}>{t('removeImage') || 'Remove'}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={[styles.moveBtn, index === images.length - 1 && styles.moveBtnDisabled]} 
                        onPress={() => moveImage(index, 1)}
                        disabled={index === images.length - 1}
                      >
                        <Feather name="chevron-right" size={20} color={index === images.length - 1 ? "#CBD5E1" : "#64748B"} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
              <View style={styles.pickerButtonRow}>
                <TouchableOpacity style={styles.pickerBtn} onPress={takePhoto}>
                  <Feather name="camera" size={16} color="#FFFFFF" style={styles.pickerBtnIconVector} />
                  <Text style={styles.pickerBtnText}>{t('addPhoto').replace(/📷\s*/, '')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.pickerBtn} onPress={pickImages}>
                  <Feather name="image" size={16} color="#FFFFFF" style={styles.pickerBtnIconVector} />
                  <Text style={styles.pickerBtnText}>{t('addFromGallery').replace(/🖼️\s*/, '')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Store Name - free text */}
          <Text style={styles.inputLabel}>{t('dealerNameLabel')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('dealerNamePlaceholder')}
            value={storeName}
            onChangeText={setStoreName}
          />

          <Text style={styles.inputLabel}>{t('dealerCityLabel')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('dealerCityPlaceholder')}
            value={dealerCity}
            onChangeText={setDealerCity}
          />

          {/* Line Items */}
          <View style={styles.lineItemsHeader}>
            <Text style={styles.inputLabel}>{t('plywoodItems')}</Text>
            <Text style={styles.totalSheets}>{t('totalSheetsLabel')}: {totalSheets} {t('sheets')}</Text>
          </View>

          {lineItems.map((item, index) => (
            <View key={index} style={styles.lineItemCard}>
              <View style={styles.lineItemHeaderRow}>
                <Text style={styles.lineItemNumber}>Item {index + 1}</Text>
                {lineItems.length > 1 && (
                  <TouchableOpacity onPress={() => removeLineItem(index)}>
                    <Text style={styles.removeItemText}>✕ Remove</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Product picker */}
              <Text style={styles.subLabel}>{t('productTypeLabel')}</Text>
              <View style={styles.pickerRow}>
                {PRODUCT_TYPES.map((p) => (
                  <TouchableOpacity 
                    key={p}
                    style={[styles.pickerItem, item.product === p && styles.pickerItemActive]}
                    onPress={() => updateLineItem(index, 'product', p)}
                  >
                    <Text style={[styles.pickerItemText, item.product === p && styles.pickerItemTextActive]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Quantity */}
              <Text style={styles.subLabel}>{t('quantityLabel')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('quantityPlaceholder')}
                keyboardType="numeric"
                value={item.quantity}
                onChangeText={(text) => updateLineItem(index, 'quantity', text.replace(/[^0-9]/g, ''))}
              />
            </View>
          ))}

          <TouchableOpacity style={styles.addItemButton} onPress={addLineItem}>
            <Text style={styles.addItemText}>{t('addAnotherItem')}</Text>
          </TouchableOpacity>

          {/* Invoice details */}
          <Text style={styles.inputLabel}>{t('invoiceNumberLabel')}</Text>
          <TextInput style={styles.input} placeholder={t('invoiceNumberPlaceholder')} autoCapitalize="characters" value={invoiceNumber} onChangeText={setInvoiceNumber} />

          <Text style={styles.inputLabel}>{t('purchaseDateLabel')}</Text>
          <TextInput style={styles.input} placeholder={t('purchaseDatePlaceholder')} value={purchaseDate} onChangeText={setPurchaseDate} />

          <Text style={styles.inputLabel}>{t('securityCode')}</Text>
          <TextInput style={styles.input} placeholder={t('securityCodePlaceholder')} autoCapitalize="characters" value={qrCode} onChangeText={setQrCode} />

          {/* Submit */}
          <TouchableOpacity style={[styles.submitButton, loading && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>{t('submitClaim')} ({totalSheets} {t('sheets')})</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  backButton: { paddingVertical: 6, paddingHorizontal: 8 },
  backText: { fontSize: 14, color: '#1E4620', fontWeight: 'bold' },
  topTitle: { fontSize: 17, fontWeight: 'bold', color: '#1E4620' },

  imageSelectorBox: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E2E8F0', borderStyle: 'dashed', borderRadius: 16, padding: 20, marginBottom: 16, minHeight: 160, justifyContent: 'center' },
  placeholderContainer: { alignItems: 'center' },
  uploadIcon: { fontSize: 32 },
  uploadTitle: { fontSize: 14, fontWeight: 'bold', color: '#475569', marginTop: 6 },
  uploadSub: { fontSize: 11, color: '#94A3B8', marginTop: 3, textAlign: 'center' },
  uploadHint: { fontSize: 11, color: '#64748B', marginTop: 10, textAlign: 'center' },
  pickerButtonRow: { flexDirection: 'row', gap: 14, marginTop: 14 },
  pickerBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E4620', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  pickerBtnIconVector: { marginRight: 8 },
  pickerBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' },
  previewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  previewCard: { width: '48%' },
  imagePreview: { width: '100%', height: 150, borderRadius: 12, backgroundColor: '#E2E8F0' },
  imageActionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  moveBtn: { padding: 6, backgroundColor: '#F1F5F9', borderRadius: 8 },
  moveBtnDisabled: { opacity: 0.5 },
  clearBtn: { flexDirection: 'row', backgroundColor: 'rgba(239,68,68,0.1)', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: '#EF4444', alignItems: 'center', justifyContent: 'center', flex: 1, marginHorizontal: 6 },
  clearBtnText: { color: '#EF4444', fontSize: 11, fontWeight: 'bold' },

  form: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#475569', marginTop: 10, marginBottom: 6 },
  subLabel: { fontSize: 11, fontWeight: '600', color: '#64748B', marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 10, backgroundColor: '#F8FAFC', paddingHorizontal: 12, height: 42, fontSize: 14, color: '#1E293B', fontWeight: '500', marginBottom: 6 },

  lineItemsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  totalSheets: { fontSize: 12, fontWeight: '800', color: '#1E4620', backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },

  lineItemCard: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, marginTop: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  lineItemHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  lineItemNumber: { fontSize: 12, fontWeight: 'bold', color: '#1E4620' },
  removeItemText: { fontSize: 11, fontWeight: 'bold', color: '#EF4444' },

  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  pickerItem: { borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 8, paddingVertical: 5, paddingHorizontal: 10, backgroundColor: '#FFFFFF' },
  pickerItemActive: { borderColor: '#1E4620', backgroundColor: '#F0FDF4' },
  pickerItemText: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  pickerItemTextActive: { color: '#1E4620', fontWeight: 'bold' },

  addItemButton: { borderWidth: 1.5, borderColor: '#1E4620', borderStyle: 'dashed', borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 10, marginBottom: 4 },
  addItemText: { color: '#1E4620', fontSize: 13, fontWeight: 'bold' },

  submitButton: { backgroundColor: '#D97706', borderRadius: 12, height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 18, shadowColor: '#D97706', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6 },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', letterSpacing: 0.5 },
});
