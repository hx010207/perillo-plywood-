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
  const [lineItems, setLineItems] = useState([{ product: 'Perillo Pro', quantity: '' }]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toLocaleDateString('en-IN'));
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);

  const addLineItem = () => {
    setLineItems([...lineItems, { product: 'Perillo Pro', quantity: '' }]);
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
      Alert.alert(t('permissionDenied') || 'Permission Denied', t('cameraPermission') || 'Camera permission is required');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
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
      Alert.alert(t('permissionDenied') || 'Permission Denied', t('galleryPermission') || 'Gallery permission is required');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      addPickedImages(result.assets.map((asset) => asset.uri));
    }
  };

  const removeImage = (uriToRemove) => {
    setImages(images.filter((uri) => uri !== uriToRemove));
  };

  const moveImage = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    const updated = [...images];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setImages(updated);
  };

  const handleSubmit = async () => {
    if (images.length === 0) {
      Alert.alert(t('error') || 'Error', t('invoiceImageRequired') || 'Please upload at least one invoice image');
      return;
    }
    if (!storeName.trim()) {
      Alert.alert(t('error') || 'Error', t('dealerStoreRequired') || 'Please enter dealer / store name');
      return;
    }
    if (!dealerCity.trim()) {
      Alert.alert(t('error') || 'Error', t('dealerCityRequired') || 'Please enter dealer city / town');
      return;
    }

    const invalidItems = lineItems.some(
      (item) => !item.product || isNaN(parseInt(item.quantity, 10)) || parseInt(item.quantity, 10) <= 0
    );
    if (invalidItems) {
      Alert.alert(t('error') || 'Error', t('validLineItemsRequired') || 'Please enter valid quantity for all items');
      return;
    }

    if (!invoiceNumber.trim()) {
      Alert.alert(t('error') || 'Error', t('invoiceNumberRequired') || 'Please enter invoice number');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      images.forEach((uri, idx) => {
        const uriToUpload = normalizeUploadUri(uri);
        const filename = uri.split('/').pop() || `invoice_${idx + 1}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const ext = match ? match[1].toLowerCase() : 'jpg';
        const type = ext === 'png' ? 'image/png' : 'image/jpeg';

        formData.append('invoices', {
          uri: uriToUpload,
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
      formData.append('invoiceNumber', invoiceNumber.trim());
      formData.append('purchaseDate', purchaseDate.trim());
      formData.append('qrCode', qrCode.trim());

      const response = await fetch(`${apiUrl}/invoices`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (response.ok && data.success) {
        Alert.alert(
          t('invoiceSubmitted') || 'Claim Submitted',
          `Claim ID: ${data.trackingId}\nTotal Sheets: ${totalSheets}\nUnder verification by Perillo team.`,
          [{ text: t('ok') || 'OK', onPress: onBack }]
        );
      } else {
        Alert.alert(t('uploadFailed') || 'Submission Failed', data.error || 'Failed to submit invoice');
      }
    } catch (err) {
      console.error('Invoice upload error:', err);
      Alert.alert(t('uploadErrorTitle') || 'Connection Error', t('uploadError') || 'Network error while submitting invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Top Header */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>← {t('back') || 'Back'}</Text>
          </TouchableOpacity>
          <Text style={styles.topTitle}>{t('newClaim') || 'New Claim'}</Text>
          <View style={{ width: 50 }} />
        </View>

        {/* Section 1: Image Uploader */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>1. {t('uploadInvoiceReceipt') || 'UPLOAD INVOICE'}</Text>
          <Text style={styles.helperText}>{t('imageMustBeClear') || 'Invoice receipt image must be clear and readable.'}</Text>

          <View style={styles.imageSelectorBox}>
            {images.length === 0 ? (
              <View style={styles.placeholderContainer}>
                <Feather name="upload-cloud" size={36} color="#8C6D58" />
                <Text style={styles.uploadTitle}>No Invoice Attached</Text>
                <View style={styles.pickerButtonRow}>
                  <TouchableOpacity style={styles.pickerBtn} onPress={takePhoto}>
                    <Feather name="camera" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.pickerBtnText}>{t('camera') || 'Camera'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.pickerBtn} onPress={pickImages}>
                    <Feather name="image" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.pickerBtnText}>{t('gallery') || 'Gallery'}</Text>
                  </TouchableOpacity>
                </View>
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
                          <Feather name="chevron-left" size={18} color={index === 0 ? "#D9C5B2" : "#8C6D58"} />
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.clearBtn} onPress={() => removeImage(uri)}>
                          <Feather name="trash-2" size={14} color="#EF4444" style={{ marginRight: 4 }} />
                          <Text style={styles.clearBtnText}>Remove</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                          style={[styles.moveBtn, index === images.length - 1 && styles.moveBtnDisabled]} 
                          onPress={() => moveImage(index, 1)}
                          disabled={index === images.length - 1}
                        >
                          <Feather name="chevron-right" size={18} color={index === images.length - 1 ? "#D9C5B2" : "#8C6D58"} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>

                <View style={styles.pickerButtonRow}>
                  <TouchableOpacity style={styles.pickerBtnSecondary} onPress={takePhoto}>
                    <Feather name="camera" size={14} color="#8C6D58" style={{ marginRight: 6 }} />
                    <Text style={styles.pickerBtnSecondaryText}>+ Camera</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.pickerBtnSecondary} onPress={pickImages}>
                    <Feather name="image" size={14} color="#8C6D58" style={{ marginRight: 6 }} />
                    <Text style={styles.pickerBtnSecondaryText}>+ Gallery</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Section 2: Dealer Details */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>2. {t('dealerDetails') || 'DEALER DETAILS'}</Text>
          <Text style={styles.helperText}>Store & location where plywood was purchased</Text>

          <Text style={styles.inputLabel}>{t('dealerNameLabel') || 'Dealer Store Name'} *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Sri Balaji Timber & Plywood"
            placeholderTextColor="#A89F91"
            value={storeName}
            onChangeText={setStoreName}
          />

          <Text style={styles.inputLabel}>{t('dealerCityLabel') || 'City / Town'} *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Hubballi, Karnataka"
            placeholderTextColor="#A89F91"
            value={dealerCity}
            onChangeText={setDealerCity}
          />
        </View>

        {/* Section 3: Plywood Line Items */}
        <View style={styles.card}>
          <View style={styles.lineItemsHeader}>
            <Text style={styles.sectionHeader}>3. {t('plywoodItems') || 'PLYWOOD ITEMS'}</Text>
            <Text style={styles.totalSheetsBadge}>{totalSheets} Sheets Total</Text>
          </View>
          <Text style={styles.helperText}>Add each plywood grade and quantity</Text>

          {lineItems.map((item, index) => (
            <View key={index} style={styles.lineItemBox}>
              <View style={styles.lineItemHeaderRow}>
                <Text style={styles.lineItemNumber}>Item #{index + 1}</Text>
                {lineItems.length > 1 && (
                  <TouchableOpacity onPress={() => removeLineItem(index)}>
                    <Text style={styles.removeItemText}>✕ Remove</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Product Type Chips */}
              <Text style={styles.inputLabel}>{t('productTypeLabel') || 'Grade / Type'}</Text>
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
              <Text style={styles.inputLabel}>{t('quantityLabel') || 'Quantity (Sheets)'} *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 25"
                placeholderTextColor="#A89F91"
                keyboardType="numeric"
                value={item.quantity}
                onChangeText={(text) => updateLineItem(index, 'quantity', text.replace(/[^0-9]/g, ''))}
              />
            </View>
          ))}

          <TouchableOpacity style={styles.addItemButton} onPress={addLineItem}>
            <Text style={styles.addItemText}>+ {t('addAnotherItem') || 'Add Another Item'}</Text>
          </TouchableOpacity>
        </View>

        {/* Section 4: Invoice Information */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>4. {t('invoiceDetails') || 'INVOICE DETAILS'}</Text>
          <Text style={styles.helperText}>Invoice number and date from receipt</Text>

          <Text style={styles.inputLabel}>{t('invoiceNumberLabel') || 'Invoice Number'} *</Text>
          <TextInput 
            style={styles.input} 
            placeholder="e.g. INV-2026-908" 
            placeholderTextColor="#A89F91"
            autoCapitalize="characters" 
            value={invoiceNumber} 
            onChangeText={setInvoiceNumber} 
          />

          <Text style={styles.inputLabel}>{t('purchaseDateLabel') || 'Purchase Date'} *</Text>
          <TextInput 
            style={styles.input} 
            placeholder="DD/MM/YYYY" 
            placeholderTextColor="#A89F91"
            value={purchaseDate} 
            onChangeText={setPurchaseDate} 
          />

          <Text style={styles.inputLabel}>{t('securityCode') || 'Sheet Security Code (Optional)'}</Text>
          <TextInput 
            style={styles.input} 
            placeholder="e.g. PRL-8823" 
            placeholderTextColor="#A89F91"
            autoCapitalize="characters" 
            value={qrCode} 
            onChangeText={setQrCode} 
          />

          {/* Submit Claim Button */}
          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
            onPress={handleSubmit} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>
                ⚡ {t('submitClaim') || 'SUBMIT CLAIM'} ({totalSheets} SHEETS)
              </Text>
            )}
          </TouchableOpacity>
        </View>
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
    paddingBottom: 50,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  backText: {
    fontSize: 14,
    color: '#8C6D58',
    fontWeight: '800',
  },
  topTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2A1E17',
  },
  card: {
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
  sectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#8C6D58',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  helperText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B5A4E',
    marginTop: 2,
    marginBottom: 12,
  },
  imageSelectorBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(140, 109, 88, 0.3)',
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  uploadTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2A1E17',
    marginTop: 6,
  },
  pickerButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8C6D58',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  pickerBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  pickerBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(140, 109, 88, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(140, 109, 88, 0.3)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  pickerBtnSecondaryText: {
    color: '#8C6D58',
    fontSize: 12,
    fontWeight: '800',
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  previewCard: {
    width: '48%',
  },
  imagePreview: {
    width: '100%',
    height: 130,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  imageActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  moveBtn: {
    padding: 4,
    backgroundColor: '#FAF7F2',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(140, 109, 88, 0.2)',
  },
  moveBtnDisabled: {
    opacity: 0.4,
  },
  clearBtn: {
    flexDirection: 'row',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  clearBtnText: {
    color: '#EF4444',
    fontSize: 10.5,
    fontWeight: '800',
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#6B5A4E',
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(140, 109, 88, 0.25)',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    height: 44,
    fontSize: 13.5,
    color: '#2A1E17',
    fontWeight: '600',
    marginBottom: 6,
  },
  lineItemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalSheetsBadge: {
    fontSize: 11,
    fontWeight: '900',
    color: '#065F46',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  lineItemBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(140, 109, 88, 0.2)',
  },
  lineItemHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  lineItemNumber: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#8C6D58',
  },
  removeItemText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EF4444',
  },
  pickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  pickerItem: {
    borderWidth: 1,
    borderColor: 'rgba(140, 109, 88, 0.25)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#FAF7F2',
  },
  pickerItemActive: {
    borderColor: '#8C6D58',
    backgroundColor: 'rgba(140, 109, 88, 0.15)',
  },
  pickerItemText: {
    fontSize: 11,
    color: '#6B5A4E',
    fontWeight: '700',
  },
  pickerItemTextActive: {
    color: '#2A1E17',
    fontWeight: '900',
  },
  addItemButton: {
    borderWidth: 1.5,
    borderColor: '#8C6D58',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: 'rgba(140, 109, 88, 0.05)',
  },
  addItemText: {
    color: '#8C6D58',
    fontSize: 12.5,
    fontWeight: '800',
  },
  submitButton: {
    backgroundColor: '#8C6D58',
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#8C6D58',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
