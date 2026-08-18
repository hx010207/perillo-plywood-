import React, { useState, useEffect } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { User, Invoice } from '../../types';
import { fetchInvoices } from '../../services/api';
import { FileText, RefreshCw, ChevronRight } from 'lucide-react';

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-[#10B981]/15 text-[#065F46] dark:text-emerald-300 border-[#10B981]/30';
      case 'Rejected':
        return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-400/40';
      default:
        return 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-400/40';
    }
  };

  return (
    <div className="space-y-4 pb-28 sm:pb-12 max-w-4xl mx-auto text-[#2A1E17] dark:text-[#FAF7F2]">
      {/* Header Row */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-black text-[#2A1E17] dark:text-[#FAF7F2] tracking-tight">{t('claimsHistory')}</h2>
          <p className="text-xs font-semibold text-[#6B5A4E] dark:text-[#A89F91] mt-0.5">All submitted purchase invoices and points ledger</p>
        </div>
        <button
          onClick={loadInvoices}
          className="flex items-center space-x-1.5 text-xs font-bold text-[#6B5A4E] hover:text-[#2A1E17] dark:text-[#A89F91] dark:hover:text-white transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{t('pullRefresh')}</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 bg-[#FAF7F2]/80 dark:bg-[#1A1410]/60 rounded-2xl border border-[#8C6D58]/20 text-[#6B5A4E] dark:text-[#A89F91] text-xs font-semibold">
          Loading claims ledger...
        </div>
      ) : invoices.length === 0 ? (
        <div className="relative rounded-2xl bg-[#FAF7F2]/90 dark:bg-[#1A1410]/85 backdrop-blur-xl border border-[#8C6D58]/25 dark:border-[#8C6D58]/30 p-12 text-center space-y-3 shadow-lg shadow-stone-900/5 before:absolute before:inset-2 before:border before:border-dashed before:border-[#8C6D58]/20 dark:before:border-white/10 before:pointer-events-none before:rounded-xl">
          <div className="relative z-10 space-y-3">
            <FileText className="w-12 h-12 text-[#8C6D58]/50 mx-auto" />
            <h3 className="text-base font-extrabold text-[#2A1E17] dark:text-[#FAF7F2]">{t('noClaimsFound')}</h3>
            <p className="text-xs font-semibold text-[#6B5A4E] dark:text-[#A89F91] max-w-sm mx-auto leading-relaxed">
              {t('noClaimsSubText')}
            </p>
          </div>
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
                className="relative rounded-2xl bg-[#FAF7F2]/90 dark:bg-[#1A1410]/85 backdrop-blur-xl border border-[#8C6D58]/25 dark:border-[#8C6D58]/30 p-5 shadow-lg shadow-stone-900/5 cursor-pointer group press-scale hover:border-[#8C6D58] transition-all space-y-3 before:absolute before:inset-1.5 before:border before:border-dashed before:border-[#8C6D58]/20 dark:before:border-white/10 before:pointer-events-none before:rounded-xl"
              >
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#8C6D58]/15 dark:border-white/10">
                    <span className="text-xs font-bold text-[#6B5A4E] dark:text-[#A89F91]">
                      Claim ID: {item.id}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border ${getStatusBadge(item.status)}`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-black text-[#2A1E17] dark:text-[#FAF7F2] group-hover:text-[#8C6D58] dark:group-hover:text-[#D9C5B2] transition-colors">
                        🏪 {storeName}
                      </h4>
                      <p className="text-xs font-semibold text-[#6B5A4E] dark:text-[#A89F91] mt-0.5">{dealerCity}</p>
                      <p className="text-xs text-[#8C6D58] dark:text-[#D9C5B2] font-bold mt-1 truncate">
                        {itemSummary}
                      </p>
                    </div>

                    {item.status === 'Approved' && (
                      <div className="text-right">
                        <span className="text-sm sm:text-base font-black text-[#065F46] dark:text-emerald-400">
                          +{item.points_earned} Pts
                        </span>
                        <p className="text-[10px] font-semibold text-[#6B5A4E] dark:text-[#A89F91] mt-0.5">Credited to wallet</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#8C6D58]/15 dark:border-white/10 text-xs">
                    <div>
                      <span className="font-black text-[#2A1E17] dark:text-[#FAF7F2]">
                        {item.quantity} {t('sheets')}
                      </span>
                      <span className="text-[11px] font-medium text-[#6B5A4E] dark:text-[#A89F91] ml-2">
                        Inv #{item.invoice_number} • {item.purchase_date}
                      </span>
                    </div>

                    <ChevronRight className="w-4 h-4 text-[#8C6D58]/60 group-hover:text-[#8C6D58] transition-colors" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
