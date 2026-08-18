import React, { useState } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { User } from '../../types';
import { submitInvoice } from '../../services/api';
import { ImageUploader } from '../../components/common/ImageUploader';
import { ArrowLeft, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Modal } from '../../components/common/Modal';

const PRODUCT_TYPES = ['Perillo Pro', 'Perillo Star', 'Perillo Club', 'Perillo Shuttering Plywood'];

interface UploadInvoiceTabProps {
  user: User;
  onBack: () => void;
}

export const UploadInvoiceTab: React.FC<UploadInvoiceTabProps> = ({ user, onBack }) => {
  const { t } = useI18n();
  const [images, setImages] = useState<File[]>([]);
  const [storeName, setStoreName] = useState('');
  const [dealerCity, setDealerCity] = useState('');
  const [lineItems, setLineItems] = useState<{ product: string; quantity: string }[]>([
    { product: '', quantity: '' },
  ]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toLocaleDateString('en-IN'));
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [alertState, setAlertState] = useState<{ isOpen: boolean; title: string; message: string; isSuccess?: boolean }>({
    isOpen: false,
    title: '',
    message: '',
  });

  const addLineItem = () => {
    setLineItems([...lineItems, { product: '', quantity: '' }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: 'product' | 'quantity', value: string) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const totalSheets = lineItems.reduce((sum, item) => {
    const qty = parseInt(item.quantity, 10);
    return sum + (isNaN(qty) ? 0 : qty);
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (images.length === 0) {
      setAlertState({ isOpen: true, title: t('photoRequired'), message: t('photoRequiredMsg') });
      return;
    }
    if (!storeName.trim()) {
      setAlertState({ isOpen: true, title: t('error'), message: t('dealerNameRequired') });
      return;
    }
    if (!dealerCity.trim()) {
      setAlertState({ isOpen: true, title: t('error'), message: t('dealerCityRequired') });
      return;
    }

    for (let i = 0; i < lineItems.length; i++) {
      if (!lineItems[i].product) {
        setAlertState({ isOpen: true, title: t('error'), message: `${t('selectProduct')} ${i + 1}.` });
        return;
      }
      const qty = parseInt(lineItems[i].quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        setAlertState({ isOpen: true, title: t('error'), message: `${t('invalidQty')} ${i + 1}.` });
        return;
      }
    }

    if (!invoiceNumber.trim()) {
      setAlertState({ isOpen: true, title: t('error'), message: t('enterInvoiceNo') });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();

      images.forEach((file) => {
        formData.append('images', file);
      });

      formData.append('carpenterId', user.id);
      formData.append('storeName', storeName.trim());
      formData.append('dealerCity', dealerCity.trim());
      formData.append(
        'lineItems',
        JSON.stringify(
          lineItems.map((li) => ({
            product: li.product,
            quantity: parseInt(li.quantity, 10),
          }))
        )
      );
      formData.append('invoiceNumber', invoiceNumber.trim());
      formData.append('purchaseDate', purchaseDate.trim());
      formData.append('qrCode', qrCode.trim());

      const data = await submitInvoice(formData);
      if (data.success) {
        setAlertState({
          isOpen: true,
          title: t('invoiceSubmitted'),
          message: `${t('invoiceSubmittedMsg')} ${data.trackingId}\n${t('totalSheetsLabel')}: ${totalSheets}\n${t('pendingReview')}`,
          isSuccess: true,
        });
      } else {
        setAlertState({ isOpen: true, title: t('uploadFailed'), message: data.error || t('uploadFailedMsg') });
      }
    } catch (err: any) {
      console.error('Invoice upload error:', err);
      setAlertState({
        isOpen: true,
        title: t('uploadErrorTitle'),
        message: err?.response?.data?.error || t('uploadError'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24 sm:pb-8">
      {/* Top bar */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <button
          onClick={onBack}
          className="flex items-center space-x-1.5 text-[#1E4620] hover:text-[#122814] font-bold text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('back')}</span>
        </button>
        <h2 className="text-lg font-bold text-[#1E4620]">{t('newClaim')}</h2>
        <div className="w-12" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Multi-image uploader */}
        <ImageUploader images={images} setImages={setImages} />

        {/* Store & Dealer Details */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              {t('dealerNameLabel')} *
            </label>
            <input
              type="text"
              required
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder={t('dealerNamePlaceholder')}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-emerald-700 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              {t('dealerCityLabel')} *
            </label>
            <input
              type="text"
              required
              value={dealerCity}
              onChange={(e) => setDealerCity(e.target.value)}
              placeholder={t('dealerCityPlaceholder')}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-emerald-700 focus:bg-white"
            />
          </div>
        </div>

        {/* Dynamic Line Items */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              {t('plywoodItems')}
            </h3>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-xs rounded-lg border border-emerald-300">
              {t('totalSheetsLabel')}: {totalSheets} {t('sheets')}
            </span>
          </div>

          {lineItems.map((item, index) => (
            <div key={index} className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1E4620]">Item {index + 1}</span>
                {lineItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLineItem(index)}
                    className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center space-x-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>

              {/* Product Type Chips */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5">
                  {t('productTypeLabel')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRODUCT_TYPES.map((p) => {
                    const active = item.product === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => updateLineItem(index, 'product', p)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                          active
                            ? 'bg-emerald-100 border-emerald-600 text-[#1E4620]'
                            : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  {t('quantityLabel')}
                </label>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateLineItem(index, 'quantity', e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder={t('quantityPlaceholder')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-sm font-semibold"
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addLineItem}
            className="w-full py-2.5 border-2 border-dashed border-[#1E4620] text-[#1E4620] hover:bg-emerald-50 font-bold text-xs rounded-xl flex items-center justify-center space-x-1 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addAnotherItem')}</span>
          </button>
        </div>

        {/* Invoice Details */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              {t('invoiceNumberLabel')} *
            </label>
            <input
              type="text"
              required
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value.toUpperCase())}
              placeholder={t('invoiceNumberPlaceholder')}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-slate-50 text-sm font-semibold uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              {t('purchaseDateLabel')} *
            </label>
            <input
              type="text"
              required
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              placeholder={t('purchaseDatePlaceholder')}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-slate-50 text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              {t('securityCode')}
            </label>
            <input
              type="text"
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value.toUpperCase())}
              placeholder={t('securityCodePlaceholder')}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-slate-50 text-sm font-medium uppercase"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-[#D97706] hover:bg-[#b56304] text-white font-bold text-sm uppercase tracking-wider rounded-2xl shadow-lg transition-all active:scale-[0.99] disabled:opacity-75"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
          ) : (
            <span>{t('submitClaim')} ({totalSheets} {t('sheets')})</span>
          )}
        </button>
      </form>

      {/* Alert Modal */}
      <Modal
        isOpen={alertState.isOpen}
        onClose={() => {
          setAlertState({ ...alertState, isOpen: false });
          if (alertState.isSuccess) {
            onBack();
          }
        }}
        title={alertState.title}
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-sm font-semibold text-slate-700">
            {alertState.isSuccess ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-8 h-8 text-rose-600 flex-shrink-0" />
            )}
            <p className="whitespace-pre-line leading-relaxed">{alertState.message}</p>
          </div>
          <div className="flex justify-end pt-2">
            <button
              onClick={() => {
                setAlertState({ ...alertState, isOpen: false });
                if (alertState.isSuccess) {
                  onBack();
                }
              }}
              className="px-5 py-2.5 bg-[#1E4620] text-white font-bold text-xs rounded-xl shadow-sm hover:bg-[#163318]"
            >
              {t('ok')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
