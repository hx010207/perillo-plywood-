import React from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { Invoice, LineItem } from '../../types';
import { ArrowLeft, AlertTriangle, FileCheck, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { SpotlightCard } from '../../components/reactbits/SpotlightCard';

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40';
      case 'Rejected':
        return 'bg-rose-500/20 text-rose-300 border-rose-400/40';
      default:
        return 'bg-amber-500/20 text-amber-300 border-amber-400/30';
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-28 sm:pb-12 text-white">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <button
          onClick={onBack}
          className="flex items-center space-x-1.5 text-emerald-400 hover:text-emerald-300 font-bold text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('back')}</span>
        </button>
        <h2 className="text-lg font-black font-display text-white">{t('invoiceDetails')}</h2>
        <div className="w-12" />
      </div>

      {/* Image Gallery Preview */}
      <SpotlightCard className="p-4 sm:p-5 space-y-3">
        {images.length > 0 ? (
          <div>
            <div className="relative h-64 sm:h-80 w-full rounded-2xl overflow-hidden bg-black/60 border border-white/15 shadow-inner">
              <img src={images[0]} alt="Submitted Invoice" className="w-full h-full object-contain bg-black/80" />
              <div className="absolute bottom-0 inset-x-0 bg-black/80 backdrop-blur-md py-2 px-4 text-center">
                <span className="text-xs font-mono font-bold text-emerald-300">
                  {t('submittedAttachment')} • Verified Cloud Copy
                </span>
              </div>
            </div>

            {images.length > 1 && (
              <div className="flex items-center space-x-3 overflow-x-auto py-2">
                {images.map((uri, idx) => (
                  <img
                    key={`${uri}-${idx}`}
                    src={uri}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-20 h-20 rounded-xl object-cover border border-white/20 shadow-sm"
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="h-40 rounded-2xl border border-white/10 bg-black/40 flex items-center justify-center text-slate-400 font-mono text-xs">
            No attached invoice images
          </div>
        )}
      </SpotlightCard>

      {/* Details Card */}
      <SpotlightCard className="p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase">Claim Tracking ID</span>
            <h3 className="text-xl font-black font-mono text-white">{item.id}</h3>
          </div>
          <span className={`px-3 py-1 rounded-xl text-xs font-mono font-black uppercase tracking-wider border ${getStatusBadge(item.status)}`}>
            {item.status}
          </span>
        </div>

        {/* Rejection reason banner */}
        {item.status === 'Rejected' && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-400/30 space-y-1">
            <div className="flex items-center text-rose-300 text-xs font-bold space-x-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>{t('rejectionReason')}</span>
            </div>
            <p className="text-xs text-rose-200 font-medium">{item.rejection_reason || 'Verification failed'}</p>
          </div>
        )}

        {/* Key-Value Details */}
        <div className="divide-y divide-white/10 text-sm">
          <div className="py-2.5 flex justify-between">
            <span className="text-slate-400 font-medium">{t('dealerName')}</span>
            <span className="font-bold text-white">{storeName}</span>
          </div>

          <div className="py-2.5 flex justify-between">
            <span className="text-slate-400 font-medium">{t('dealerCityLabel')}</span>
            <span className="font-bold text-white">{dealerCity}</span>
          </div>

          {/* Line items list */}
          {lineItems.length > 0 ? (
            <div className="py-3 space-y-2">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                {t('lineItems')}
              </span>
              <div className="bg-black/40 rounded-2xl p-3.5 border border-white/10 space-y-2">
                {lineItems.map((li, idx) => (
                  <div key={idx} className="flex justify-between text-xs font-semibold text-slate-200">
                    <span>{li.product}</span>
                    <span className="font-mono font-bold text-emerald-400">×{li.quantity} Sheets</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-400 font-medium">{t('productType')}</span>
              <span className="font-bold text-white">{item.product_type}</span>
            </div>
          )}

          <div className="py-2.5 flex justify-between">
            <span className="text-slate-400 font-medium">{t('quantity')}</span>
            <span className="font-mono font-bold text-amber-300">{item.quantity} Sheets Total</span>
          </div>

          <div className="py-2.5 flex justify-between">
            <span className="text-slate-400 font-medium">{t('invoiceNumber')}</span>
            <span className="font-mono font-bold text-white">{item.invoice_number}</span>
          </div>

          <div className="py-2.5 flex justify-between">
            <span className="text-slate-400 font-medium">{t('purchaseDate')}</span>
            <span className="font-mono text-white">{item.purchase_date}</span>
          </div>

          {item.status === 'Approved' && (
            <div className="py-3 flex justify-between items-center text-emerald-400">
              <span className="font-bold text-sm">{t('pointsEarned')}</span>
              <span className="text-xl font-black font-mono">+{item.points_earned} Pts</span>
            </div>
          )}
        </div>
      </SpotlightCard>
    </div>
  );
};
