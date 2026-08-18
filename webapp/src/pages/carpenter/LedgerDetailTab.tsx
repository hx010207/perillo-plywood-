import React from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { Invoice, LineItem } from '../../types';
import { ArrowLeft, AlertTriangle, FileCheck } from 'lucide-react';
import { Badge } from '../../components/common/Badge';

interface LedgerDetailTabProps {
  item: Invoice;
  onBack: () => void;
}

const buildImageUri = (imagePath?: string): string => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  return imagePath;
};

const parseImageList = (item: Invoice): string[] => {
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

export const LedgerDetailTab: React.FC<LedgerDetailTabProps> = ({ item, onBack }) => {
  const { t } = useI18n();

  const images = parseImageList(item).map(buildImageUri).filter(Boolean);
  const storeName = item.store_name || item.dealer_name || '-';
  const dealerCity = item.dealer_city || '-';

  let lineItems: LineItem[] = [];
  if (item.line_items) {
    try {
      lineItems = typeof item.line_items === 'string' ? JSON.parse(item.line_items) : item.line_items;
    } catch (e) {}
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24 sm:pb-8">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <button
          onClick={onBack}
          className="flex items-center space-x-1.5 text-[#1E4620] hover:text-[#122814] font-bold text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('back')}</span>
        </button>
        <h2 className="text-lg font-bold text-[#1E4620]">{t('invoiceDetails')}</h2>
        <div className="w-12" />
      </div>

      {/* Image Gallery */}
      <div className="space-y-3">
        {images.length > 0 ? (
          <div>
            <div className="relative h-64 sm:h-80 w-full rounded-2xl overflow-hidden bg-slate-200 border border-slate-300 shadow-sm">
              <img src={images[0]} alt="Submitted Invoice" className="w-full h-full object-contain bg-slate-900" />
              <div className="absolute bottom-0 inset-x-0 bg-slate-900/80 backdrop-blur-xs py-2 px-4 text-center">
                <span className="text-xs font-bold text-white">{t('submittedAttachment')}</span>
              </div>
            </div>

            {images.length > 1 && (
              <div className="flex items-center space-x-3 overflow-x-auto py-2">
                {images.map((uri, idx) => (
                  <img
                    key={`${uri}-${idx}`}
                    src={uri}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-20 h-20 rounded-xl object-cover border border-slate-300 shadow-2xs"
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="h-40 rounded-2xl border border-slate-300 bg-white flex items-center justify-center text-slate-400 font-semibold text-xs">
            No attached invoice images
          </div>
        )}
      </div>

      {/* Details Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-xl font-black text-slate-900">{item.id}</h3>
          <Badge status={item.status} />
        </div>

        {/* Rejection reason banner */}
        {item.status === 'Rejected' && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
            <div className="flex items-center text-rose-800 text-xs font-bold space-x-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>{t('rejectionReason')}</span>
            </div>
            <p className="text-xs text-rose-700 font-medium">{item.rejection_reason || 'Verification failed'}</p>
          </div>
        )}

        {/* Key-Value Details */}
        <div className="divide-y divide-slate-100 text-sm">
          <div className="py-2.5 flex justify-between">
            <span className="text-slate-500 font-medium">{t('dealerName')}</span>
            <span className="font-bold text-slate-800">{storeName}</span>
          </div>

          <div className="py-2.5 flex justify-between">
            <span className="text-slate-500 font-medium">{t('dealerCityLabel')}</span>
            <span className="font-bold text-slate-800">{dealerCity}</span>
          </div>

          {/* Line items list */}
          {lineItems.length > 0 ? (
            <div className="py-3 space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('lineItems')}</span>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
                {lineItems.map((li, idx) => (
                  <div key={idx} className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{li.product}</span>
                    <span className="font-bold text-[#1E4620]">×{li.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500 font-medium">{t('productType')}</span>
              <span className="font-bold text-slate-800">{item.product_type}</span>
            </div>
          )}

          <div className="py-2.5 flex justify-between">
            <span className="text-slate-500 font-medium">{t('quantity')}</span>
            <span className="font-bold text-[#1E4620]">{item.quantity} Sheets</span>
          </div>

          <div className="py-2.5 flex justify-between">
            <span className="text-slate-500 font-medium">{t('invoiceNumber')}</span>
            <span className="font-bold text-slate-800">{item.invoice_number}</span>
          </div>

          <div className="py-2.5 flex justify-between">
            <span className="text-slate-500 font-medium">{t('purchaseDate')}</span>
            <span className="font-bold text-slate-800">{item.purchase_date}</span>
          </div>

          <div className="py-2.5 flex justify-between">
            <span className="text-slate-500 font-medium">{t('qrCode')}</span>
            <span className="font-bold text-slate-800">{item.qr_code || t('none')}</span>
          </div>

          {item.status === 'Approved' && (
            <div className="py-3 flex justify-between items-center text-[#1E4620]">
              <span className="font-bold text-sm">{t('pointsEarned')}</span>
              <span className="text-lg font-black">+{item.points_earned} Pts</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
