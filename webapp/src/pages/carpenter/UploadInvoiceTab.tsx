import React, { useState } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { User } from '../../types';
import { submitInvoice } from '../../services/api';
import { ImageUploader } from '../../components/common/ImageUploader';
import { ArrowLeft, Plus, Trash2, CheckCircle2, AlertCircle, Sparkles, ShieldCheck, FileCheck } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { SpotlightCard } from '../../components/reactbits/SpotlightCard';

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
    { product: 'Perillo Pro', quantity: '10' },
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
    setLineItems([...lineItems, { product: 'Perillo Pro', quantity: '5' }]);
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
    <div className="max-w-3xl mx-auto space-y-6 pb-28 sm:pb-12 text-white">
      {/* Top bar */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <button
          onClick={onBack}
          className="flex items-center space-x-1.5 text-emerald-400 hover:text-emerald-300 font-bold text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('back')}</span>
        </button>
        <h2 className="text-lg font-black font-display text-white">{t('newClaim')}</h2>
        <div className="w-12" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Multi-image uploader dropzone */}
        <SpotlightCard className="p-5 sm:p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400">
              1. Upload Invoice Receipt
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Invoice image must be clear, showing dealer name and sheet quantities.
            </p>
          </div>
          <ImageUploader images={images} setImages={setImages} />
        </SpotlightCard>

        {/* 2. Store & Dealer Details */}
        <SpotlightCard className="p-5 sm:p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400">
            2. Dealer Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wide text-slate-300 mb-1.5">
                {t('dealerNameLabel')} *
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="e.g. Mahadev Timber Traders"
                className="w-full px-3.5 py-3 rounded-xl bg-black/40 border border-white/15 text-sm font-semibold text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wide text-slate-300 mb-1.5">
                {t('dealerCityLabel')} *
              </label>
              <input
                type="text"
                required
                value={dealerCity}
                onChange={(e) => setDealerCity(e.target.value)}
                placeholder="e.g. Hubballi, Karnataka"
                className="w-full px-3.5 py-3 rounded-xl bg-black/40 border border-white/15 text-sm font-semibold text-white focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>
        </SpotlightCard>

        {/* 3. Dynamic Plywood Items Selector */}
        <SpotlightCard className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400">
                3. {t('plywoodItems')}
              </h3>
              <p className="text-xs text-slate-400">Add all purchased Perillo products</p>
            </div>
            <span className="px-3.5 py-1.5 bg-emerald-500/20 text-emerald-300 font-mono font-black text-xs rounded-xl border border-emerald-400/40 shadow-xs">
              {t('totalSheetsLabel')}: {totalSheets} {t('sheets')}
            </span>
          </div>

          <div className="space-y-3">
            {lineItems.map((item, index) => (
              <div key={index} className="bg-black/40 rounded-2xl p-4 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-400">Item 0{index + 1}</span>
                  {lineItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLineItem(index)}
                      className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                {/* Product Type Chips */}
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1.5 uppercase">
                    Select Product Grade:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PRODUCT_TYPES.map((p) => {
                      const active = item.product === p;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => updateLineItem(index, 'product', p)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                            active
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow-glow-emerald'
                              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
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
                  <label className="block text-[11px] font-mono text-slate-400 mb-1 uppercase">
                    Quantity (Sheets):
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateLineItem(index, 'quantity', e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="e.g. 10"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e1611] border border-white/15 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addLineItem}
            className="w-full py-3 border-2 border-dashed border-emerald-500/40 hover:border-emerald-400 text-emerald-300 hover:bg-emerald-500/10 font-bold text-xs rounded-2xl flex items-center justify-center space-x-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addAnotherItem')}</span>
          </button>
        </SpotlightCard>

        {/* 4. Invoice Metadata */}
        <SpotlightCard className="p-5 sm:p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400">
            4. Invoice Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wide text-slate-300 mb-1.5">
                {t('invoiceNumberLabel')} *
              </label>
              <input
                type="text"
                required
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value.toUpperCase())}
                placeholder="e.g. INV-89201"
                className="w-full px-3.5 py-3 rounded-xl bg-black/40 border border-white/15 text-sm font-mono font-bold text-white uppercase focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wide text-slate-300 mb-1.5">
                {t('purchaseDateLabel')} *
              </label>
              <input
                type="text"
                required
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                placeholder="DD/MM/YYYY"
                className="w-full px-3.5 py-3 rounded-xl bg-black/40 border border-white/15 text-sm font-semibold text-white focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-slate-300 mb-1.5">
              {t('securityCode')} (Optional)
            </label>
            <input
              type="text"
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value.toUpperCase())}
              placeholder="e.g. HUB-710-2026-9801"
              className="w-full px-3.5 py-3 rounded-xl bg-black/40 border border-white/15 text-sm font-mono text-white uppercase focus:outline-none focus:border-emerald-400"
            />
          </div>
        </SpotlightCard>

        {/* 5. Submit CTA Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4.5 bg-gradient-to-r from-[#D97706] to-[#B45309] hover:from-[#B45309] hover:to-[#92400E] text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-2xl hover:shadow-amber-500/25 transition-all active:scale-[0.99] disabled:opacity-70 border border-amber-400/30"
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
          <div className="flex items-center space-x-3 text-sm font-semibold text-slate-200">
            {alertState.isSuccess ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-8 h-8 text-rose-400 flex-shrink-0" />
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
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-transform active:scale-95"
            >
              {t('ok')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
