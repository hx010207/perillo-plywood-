import React, { useState, useEffect } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { User, Invoice } from '../../types';
import { fetchInvoices } from '../../services/api';
import { FileText, RefreshCw } from 'lucide-react';
import { Badge } from '../../components/common/Badge';

interface LedgerTabProps {
  user: User;
  onViewItem: (item: Invoice) => void;
  refreshKey: number;
}

export const LedgerTab: React.FC<LedgerTabProps> = ({ user, onViewItem, refreshKey }) => {
  const { t } = useI18n();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);

  const loadInvoices = async () => {
    try {
      const data = await fetchInvoices(user.id);
      setInvoices(data);
    } catch (err) {
      console.warn('Error fetching invoices:', err);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadInvoices().finally(() => setLoading(false));
  }, [user.id, refreshKey]);

  return (
    <div className="space-y-4 pb-24 sm:pb-8">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-[#1E4620]">{t('claimsHistory')}</h2>
          <p className="text-xs text-slate-500 font-medium">All submitted purchase invoices</p>
        </div>
        <button
          onClick={loadInvoices}
          className="flex items-center space-x-1 text-xs font-bold text-slate-400 hover:text-slate-600"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{t('pullRefresh')}</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs font-semibold">
          Loading history...
        </div>
      ) : invoices.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center space-y-2">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">{t('noClaimsFound')}</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            {t('noClaimsSubText')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((item) => {
            const storeName = item.store_name || item.dealer_name || '-';
            const dealerCity = item.dealer_city || '-';
            const itemSummary = item.product_type || '-';
            return (
              <div
                key={item.id}
                onClick={() => onViewItem(item)}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-emerald-500/50 transition-all cursor-pointer space-y-3 group"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-800">{item.id}</span>
                  <Badge status={item.status} />
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                    🏪 {storeName}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">{dealerCity}</p>
                  <p className="text-xs text-slate-600 font-semibold mt-1 truncate">{itemSummary}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <span className="font-extrabold text-[#1E4620]">
                      {item.quantity} {t('sheets')}
                    </span>
                    <p className="text-[11px] text-slate-400">
                      {t('invoiceNo')} {item.invoice_number} • {item.purchase_date}
                    </p>
                  </div>

                  {item.status === 'Approved' && (
                    <span className="text-sm font-black text-[#1E4620]">
                      +{item.points_earned} Pts
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
