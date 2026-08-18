import React, { useState, useEffect } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { User, Invoice } from '../../types';
import { fetchInvoices } from '../../services/api';
import { FileText, RefreshCw, ChevronRight, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

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
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40';
      case 'Rejected':
        return 'bg-rose-500/20 text-rose-300 border-rose-400/40';
      default:
        return 'bg-amber-500/20 text-amber-300 border-amber-400/40';
    }
  };

  return (
    <div className="space-y-4 pb-28 sm:pb-12 max-w-4xl mx-auto text-white">
      {/* Header Row */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">{t('claimsHistory')}</h2>
          <p className="text-xs text-slate-300 mt-0.5">All submitted purchase invoices and points ledger</p>
        </div>
        <button
          onClick={loadInvoices}
          className="flex items-center space-x-1.5 text-xs font-bold text-slate-300 hover:text-emerald-400 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{t('pullRefresh')}</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 bg-[#121A15]/60 rounded-2xl border border-white/10 text-slate-400 text-xs">
          Loading claims ledger...
        </div>
      ) : invoices.length === 0 ? (
        <div className="p-12 text-center space-y-3 rounded-2xl bg-[#121A15]/80 backdrop-blur-xl border border-white/10 shadow-xl">
          <FileText className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">{t('noClaimsFound')}</h3>
          <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
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
                className="p-5 rounded-2xl bg-[#121A15]/80 backdrop-blur-xl border border-white/10 shadow-xl cursor-pointer group press-scale hover:border-emerald-500/40 transition-all space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-xs font-bold text-slate-300">
                    Claim ID: {item.id}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(item.status)}`}>
                    {item.status}
                  </span>
                </div>

                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                      🏪 {storeName}
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5">{dealerCity}</p>
                    <p className="text-xs text-amber-300 font-semibold mt-1 truncate">
                      {itemSummary}
                    </p>
                  </div>

                  {item.status === 'Approved' && (
                    <div className="text-right">
                      <span className="text-sm sm:text-base font-extrabold text-[#10B981]">
                        +{item.points_earned} Pts
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">Credited to wallet</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                  <div>
                    <span className="font-extrabold text-white">
                      {item.quantity} {t('sheets')}
                    </span>
                    <span className="text-[11px] text-slate-400 ml-2">
                      Inv #{item.invoice_number} • {item.purchase_date}
                    </span>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
