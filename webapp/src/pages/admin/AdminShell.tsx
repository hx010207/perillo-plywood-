import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { Invoice, User, Payout } from '../../types';
import {
  fetchAdminClaims,
  fetchAdminCarpenters,
  fetchAdminPayouts,
  fetchPendingApprovals,
  processAdminClaim,
  processAdminPayout,
  approveCarpenter,
  rejectCarpenter,
  requestMoreInfo,
  suspendCarpenter,
  reactivateCarpenter,
  verifyCarpenter,
} from '../../services/api';

import { AdminTabBar, AdminTabKey } from '../../components/navigation/AdminTabBar';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LogOut, Search, CheckCircle, XCircle, AlertCircle, RefreshCw, FileText, ShieldAlert, Zap, Landmark } from 'lucide-react';

const loyaltyTiers = [
  { name: 'Member', range: '0 - 99', percent: '0.8%' },
  { name: 'Bronze', range: '100 - 399', percent: '1.0%' },
  { name: 'Silver', range: '400 - 699', percent: '1.5%' },
  { name: 'Gold', range: '700 - 999', percent: '2.0%' },
  { name: 'Platinum', range: '1000+', percent: '2.5%' },
];

const milestones = [
  { sheets: 100, gift: 'Branded utility kit' },
  { sheets: 400, gift: 'Premium tool support pack' },
  { sheets: 700, gift: 'Power tool bonus reward' },
  { sheets: 1000, gift: 'Top-tier loyalty benefit' },
];

export const AdminShell: React.FC = () => {
  const { language, setLanguage, supportedLanguages } = useI18n();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTabKey>('dashboard');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [claims, setClaims] = useState<Invoice[]>([]);
  const [carpenters, setCarpenters] = useState<User[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<User[]>([]);

  const [selectedClaim, setSelectedClaim] = useState<Invoice | null>(null);
  const [selectedCarpenter, setSelectedCarpenter] = useState<User | null>(null);
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [busyActionId, setBusyActionId] = useState('');

  // Carpenter filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const loadData = async () => {
    setRefreshing(true);
    try {
      const [claimsData, carpentersData, payoutsData, pendingData] = await Promise.all([
        fetchAdminClaims().catch(() => []),
        fetchAdminCarpenters().catch(() => []),
        fetchAdminPayouts().catch(() => []),
        fetchPendingApprovals().catch(() => []),
      ]);

      setClaims(Array.isArray(claimsData) ? claimsData : []);
      setCarpenters(Array.isArray(carpentersData) ? carpentersData : []);
      setPayouts(Array.isArray(payoutsData) ? payoutsData : []);
      setPendingApprovals(Array.isArray(pendingData) ? pendingData : []);
    } catch (err) {
      console.warn('Error loading admin data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const totalClaims = claims.length;
  const pendingClaims = claims.filter((i) => i.status === 'Pending').length;
  const totalCarpentersCount = carpenters.length;
  const pendingApprovalsCount = pendingApprovals.length;
  const pendingPayouts = payouts.filter((i) => i.status === 'Requested').length;
  const payoutTotals = payouts
    .filter((i) => i.status === 'Approved')
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const handleClaimAction = async (claimId: string, action: 'Approved' | 'Rejected') => {
    setBusyActionId(`claim-${claimId}`);
    try {
      await processAdminClaim(claimId, action, action === 'Rejected' ? rejectionReason : undefined);
      setSelectedClaim(null);
      setRejectionReason('');
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Unable to update claim');
    } finally {
      setBusyActionId('');
    }
  };

  const handleCarpenterVerify = async (carpenterId: string, verified: boolean) => {
    setBusyActionId(`carpenter-${carpenterId}`);
    try {
      await verifyCarpenter(carpenterId, verified);
      await loadData();
      if (selectedCarpenter?.id === carpenterId) {
        setSelectedCarpenter({ ...selectedCarpenter, verified });
      }
    } catch (err: any) {
      alert(err?.message || 'Unable to update verification');
    } finally {
      setBusyActionId('');
    }
  };

  const handleApprovalAction = async (carpenterId: string, action: 'Approved' | 'Rejected' | 'RequestInfo') => {
    setBusyActionId(`approval-${carpenterId}`);
    try {
      if (action === 'Approved') await approveCarpenter(carpenterId);
      else if (action === 'Rejected') await rejectCarpenter(carpenterId);
      else if (action === 'RequestInfo') await requestMoreInfo(carpenterId);

      setSelectedCarpenter(null);
      await loadData();
    } catch (err: any) {
      alert(err?.message || `Unable to ${action} carpenter`);
    } finally {
      setBusyActionId('');
    }
  };

  const handleSuspendAction = async (carpenterId: string, isSuspend: boolean) => {
    setBusyActionId(`suspend-${carpenterId}`);
    try {
      if (isSuspend) await suspendCarpenter(carpenterId);
      else await reactivateCarpenter(carpenterId);

      if (selectedCarpenter && selectedCarpenter.id === carpenterId) {
        setSelectedCarpenter({
          ...selectedCarpenter,
          status: isSuspend ? 'suspended' : 'approved',
        });
      }
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Unable to update carpenter status');
    } finally {
      setBusyActionId('');
    }
  };

  const handlePayoutAction = async (payoutId: string, action: 'Approved' | 'Rejected') => {
    setBusyActionId(`payout-${payoutId}`);
    try {
      await processAdminPayout(payoutId, action);
      setSelectedPayout(null);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Unable to update payout');
    } finally {
      setBusyActionId('');
    }
  };

  const renderClaimLineItems = (claim: Invoice | null) => {
    if (!claim) return null;
    let items: any[] = [];
    if (claim.line_items) {
      try {
        items = typeof claim.line_items === 'string' ? JSON.parse(claim.line_items) : claim.line_items;
      } catch (e) {}
    }

    if (!Array.isArray(items) || items.length === 0) {
      return (
        <div className="bg-amber-50/60 rounded-xl p-3 border border-amber-200 text-xs my-3 space-y-1">
          <h5 className="font-bold text-[#16324f]">Line Items:</h5>
          <p className="text-slate-700 font-medium">• {claim.product_type || '-'} × {claim.quantity || 0} sheets</p>
        </div>
      );
    }

    return (
      <div className="bg-amber-50/60 rounded-xl p-3 border border-amber-200 text-xs my-3 space-y-1">
        <h5 className="font-bold text-[#16324f]">Line Items:</h5>
        {items.map((it, idx) => (
          <p key={idx} className="text-slate-700 font-medium">• {it.product} × {it.quantity} sheets</p>
        ))}
        <p className="text-[#16324f] font-extrabold text-right pt-1">Total: {claim.quantity} sheets</p>
      </div>
    );
  };

  const renderCarpenterModalActions = () => {
    if (!selectedCarpenter) return null;
    const status = selectedCarpenter.status || 'pending_approval';
    const isVerified = String(selectedCarpenter.verified) === 'true' || selectedCarpenter.verified === true;

    return (
      <div className="space-y-3 pt-3 border-t border-slate-200">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-bold text-slate-600">Verification Status:</span>
          <button
            disabled={busyActionId.startsWith('carpenter-')}
            onClick={() => handleCarpenterVerify(selectedCarpenter.id, !isVerified)}
            className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-colors flex-1 ${
              isVerified ? 'bg-amber-700 hover:bg-amber-800' : 'bg-[#16324f] hover:bg-[#0f243a]'
            }`}
          >
            {isVerified ? 'Unverify Account' : 'Verify Account'}
          </button>
        </div>

        {status === 'pending_approval' && (
          <div className="grid grid-cols-3 gap-2">
            <button
              disabled={busyActionId.startsWith('approval-')}
              onClick={() => handleApprovalAction(selectedCarpenter.id, 'Rejected')}
              className="py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl"
            >
              Reject
            </button>
            <button
              disabled={busyActionId.startsWith('approval-')}
              onClick={() => handleApprovalAction(selectedCarpenter.id, 'RequestInfo')}
              className="py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl"
            >
              Need Info
            </button>
            <button
              disabled={busyActionId.startsWith('approval-')}
              onClick={() => handleApprovalAction(selectedCarpenter.id, 'Approved')}
              className="py-2.5 bg-[#1E4620] hover:bg-[#163318] text-white font-bold text-xs rounded-xl"
            >
              Approve
            </button>
          </div>
        )}

        {status === 'approved' && (
          <button
            disabled={busyActionId.startsWith('suspend-')}
            onClick={() => handleSuspendAction(selectedCarpenter.id, true)}
            className="w-full py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            Suspend Account
          </button>
        )}

        {status === 'suspended' && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-center">
            <span className="text-xs font-bold text-rose-800">Status: Account Suspended</span>
            <button
              disabled={busyActionId.startsWith('suspend-')}
              onClick={() => handleSuspendAction(selectedCarpenter.id, false)}
              className="w-full py-2 bg-[#1E4620] hover:bg-[#163318] text-white font-bold text-xs rounded-xl"
            >
              Reactivate Account
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f4f1ea] flex flex-col text-slate-900">
      {/* Admin Header */}
      <header className="bg-[#16324f] text-[#fff8e8] px-4 sm:px-8 py-4 flex items-center justify-between shadow-md">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">Perillo Plywood</h1>
          <p className="text-xs text-[#d6d0c4] font-medium">Admin Control Center</p>
        </div>

        <div className="flex items-center space-x-3">
          <span className="px-3 py-1 bg-[#f4c95d] text-[#16324f] font-black text-xs rounded-full">
            ADMIN
          </span>
          <button
            onClick={logout}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-full border border-white/25 text-xs font-bold text-white hover:bg-white/10"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Admin Navigation Tabs */}
      <AdminTabBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingApprovalsCount={pendingApprovalsCount}
        pendingClaimsCount={pendingClaims}
        pendingPayoutsCount={pendingPayouts}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-[#4f4a41]">
            <RefreshCw className="w-8 h-8 animate-spin mb-3 text-[#16324f]" />
            <p className="text-sm font-bold">Loading admin workspace...</p>
          </div>
        ) : (
          <>
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <StatCard label="Total Claims" value={totalClaims} />
                  <StatCard label="Pending Claims" value={pendingClaims} borderColor="border-l-amber-500" />
                  <StatCard label="Total Users" value={totalCarpentersCount} />
                  <StatCard label="Pending Approvals" value={pendingApprovalsCount} borderColor="border-l-amber-500" />
                  <StatCard label="Pending Payouts" value={pendingPayouts} borderColor="border-l-sky-500" />
                  <StatCard label="Payout Totals" value={`₹${payoutTotals.toLocaleString()}`} borderColor="border-l-emerald-500" />
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-black text-[#16324f]">Latest Submitted Claims</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {claims.slice(0, 4).map((claim) => (
                      <div
                        key={claim.id}
                        onClick={() => setSelectedClaim(claim)}
                        className="bg-white rounded-2xl p-4 border border-[#eadfce] shadow-xs hover:border-[#16324f] cursor-pointer transition-all space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold text-slate-900">{claim.carpenter_name || 'User'}</h4>
                          <Badge status={claim.status} />
                        </div>
                        <p className="text-xs text-slate-600 font-semibold">{claim.store_name || '-'} • {claim.dealer_city || '-'}</p>
                        <p className="text-[11px] text-slate-400">Date: {(claim.created_at || '').split('T')[0]}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Approvals Tab */}
            {activeTab === 'approvals' && (
              <div className="space-y-4">
                <h3 className="text-xl font-black text-[#16324f]">Pending Signups Approval</h3>
                {pendingApprovals.length === 0 ? (
                  <div className="bg-white rounded-2xl p-10 text-center border border-[#eadfce]">
                    <p className="text-sm font-bold text-[#72685c]">🎉 No pending signups to review</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingApprovals.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedCarpenter(item)}
                        className="bg-white rounded-2xl p-5 border border-[#eadfce] shadow-xs hover:border-[#16324f] cursor-pointer space-y-2 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold text-slate-900">{item.name}</h4>
                          <Badge status="Pending" />
                        </div>
                        <p className="text-xs text-slate-600 font-medium">Phone: +91 {item.phone}</p>
                        <p className="text-xs text-slate-600 font-medium">Aadhaar: {item.aadhaar_number || '-'}</p>
                        <p className="text-xs text-slate-500">Location: {item.city || '-'}, {item.state || '-'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Claims Tab */}
            {activeTab === 'claims' && (
              <div className="space-y-4">
                <h3 className="text-xl font-black text-[#16324f]">Claims Review</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {claims.map((claim) => (
                    <div
                      key={claim.id}
                      onClick={() => setSelectedClaim(claim)}
                      className="bg-white rounded-2xl p-5 border border-[#eadfce] shadow-xs hover:border-[#16324f] cursor-pointer space-y-2 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-slate-900">{claim.store_name || 'Invoice'}</h4>
                        <Badge status={claim.status} />
                      </div>
                      <p className="text-xs text-slate-600 font-medium">{claim.carpenter_name || '-'} • {claim.dealer_city || '-'}</p>
                      <p className="text-xs text-slate-500">Invoice #{claim.invoice_number}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'carpenters' && (
              <div className="space-y-4">
                <h3 className="text-xl font-black text-[#16324f]">User Management</h3>

                {/* Search & Filter Controls */}
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name, phone, or ID..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#eadfce] rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#16324f]"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {['all', 'pending_approval', 'approved', 'more_info_requested', 'rejected', 'suspended'].map((statusKey) => {
                      const active = statusFilter === statusKey;
                      return (
                        <button
                          key={statusKey}
                          onClick={() => setStatusFilter(statusKey)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase transition-all border ${
                            active
                              ? 'bg-[#16324f] text-white border-[#16324f]'
                              : 'bg-[#e7dfd3] text-[#4f4a41] border-[#eadfce] hover:bg-[#ded5c6]'
                          }`}
                        >
                          {statusKey.replace(/_/g, ' ')}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* User Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {carpenters
                    .filter((c) => {
                      const q = searchQuery.toLowerCase();
                      const matchQ = !q || (c.name || '').toLowerCase().includes(q) || (c.phone || '').toLowerCase().includes(q) || (c.id || '').toLowerCase().includes(q);
                      const matchS = statusFilter === 'all' || (c.status || 'pending_approval') === statusFilter;
                      return matchQ && matchS;
                    })
                    .map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedCarpenter(item)}
                        className="bg-white rounded-2xl p-5 border border-[#eadfce] shadow-xs hover:border-[#16324f] cursor-pointer space-y-2 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold text-slate-900">{item.name}</h4>
                          <Badge status={item.status} />
                        </div>
                        <p className="text-xs text-slate-600 font-medium">
                          +91 {item.phone} • Verification: {String(item.verified) === 'true' || item.verified === true ? 'Verified ✓' : 'Unverified'}
                        </p>
                        <p className="text-xs text-slate-500">Tier {item.tier || 'Member'} • {item.total_sheets || 0} sheets</p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Tiers Tab */}
            {activeTab === 'tiers' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 border border-[#eadfce] space-y-4">
                  <h3 className="text-lg font-black text-[#16324f]">Loyalty Tiers</h3>
                  <div className="divide-y divide-slate-100">
                    {loyaltyTiers.map((t) => (
                      <div key={t.name} className="py-3 flex justify-between items-center text-sm">
                        <span className="font-bold text-slate-900">{t.name}</span>
                        <span className="text-slate-500">{t.range} sheets</span>
                        <span className="font-black text-[#16324f]">{t.percent}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-[#eadfce] space-y-4">
                  <h3 className="text-lg font-black text-[#16324f]">Milestone Gifts</h3>
                  <div className="divide-y divide-slate-100">
                    {milestones.map((m) => (
                      <div key={m.sheets} className="py-3 flex justify-between items-center text-sm">
                        <span className="font-bold text-slate-900">{m.sheets} sheets</span>
                        <span className="text-slate-600 font-medium">{m.gift}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Payouts Tab */}
            {activeTab === 'payouts' && (
              <div className="space-y-4">
                <h3 className="text-xl font-black text-[#16324f]">Payout Requests</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {payouts.map((pay) => (
                    <div
                      key={pay.id}
                      onClick={() => setSelectedPayout(pay)}
                      className="bg-white rounded-2xl p-5 border border-[#eadfce] shadow-xs hover:border-[#16324f] cursor-pointer space-y-2 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-slate-900">{pay.carpenter_name || 'User'}</h4>
                        <Badge status={pay.status} />
                      </div>
                      <p className="text-xs font-bold text-emerald-800">
                        {pay.points_redeemed} points (₹{pay.amount})
                      </p>
                      <p className="text-xs text-slate-500">Phone: {pay.carpenter_phone || '-'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="bg-white rounded-2xl p-6 border border-[#eadfce] space-y-6">
                <h3 className="text-lg font-black text-[#16324f]">Settings</h3>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Language</label>
                  <div className="flex flex-wrap gap-2">
                    {supportedLanguages.map((item) => (
                      <button
                        key={item.code}
                        onClick={() => setLanguage(item.code)}
                        className={`px-4 py-2 rounded-full font-bold text-xs ${
                          language === item.code ? 'bg-[#16324f] text-white' : 'bg-[#e7dfd3] text-[#4f4a41]'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <p className="text-sm font-bold text-slate-900">Signed in as {user?.name}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Claim Detail Modal */}
      <Modal isOpen={Boolean(selectedClaim)} onClose={() => setSelectedClaim(null)} title="Claim Details" maxWidth="lg">
        {selectedClaim && (
          <div className="space-y-4 text-xs font-medium">
            <h4 className="text-lg font-bold text-slate-900">{selectedClaim.store_name || selectedClaim.dealer_name || '-'}</h4>
            <p className="text-slate-600">User: {selectedClaim.carpenter_name || '-'}</p>
            <p className="text-slate-600">City: {selectedClaim.dealer_city || '-'}</p>
            <p className="text-slate-600">Invoice #{selectedClaim.invoice_number}</p>
            <p className="text-slate-600">Purchase Date: {selectedClaim.purchase_date}</p>
            <p className="text-slate-600">Status: {selectedClaim.status}</p>

            {renderClaimLineItems(selectedClaim)}

            {selectedClaim.status === 'Pending' && (
              <div className="space-y-3 pt-2">
                <input
                  type="text"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Rejection reason (required if rejecting)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
                <div className="flex space-x-3">
                  <button
                    disabled={busyActionId === `claim-${selectedClaim.id}`}
                    onClick={() => {
                      if (!rejectionReason.trim()) {
                        alert('Please enter a rejection reason');
                        return;
                      }
                      handleClaimAction(selectedClaim.id, 'Rejected');
                    }}
                    className="flex-1 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl"
                  >
                    Reject
                  </button>
                  <button
                    disabled={busyActionId === `claim-${selectedClaim.id}`}
                    onClick={() => handleClaimAction(selectedClaim.id, 'Approved')}
                    className="flex-1 py-2.5 bg-[#1E4620] hover:bg-[#163318] text-white font-bold text-xs rounded-xl"
                  >
                    Approve
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Carpenter Detail Modal */}
      <Modal isOpen={Boolean(selectedCarpenter)} onClose={() => setSelectedCarpenter(null)} title="User Profile" maxWidth="lg">
        {selectedCarpenter && (
          <div className="space-y-3 text-xs font-medium">
            <h4 className="text-lg font-bold text-slate-900">{selectedCarpenter.name}</h4>
            <p className="text-slate-600">ID: {selectedCarpenter.id}</p>
            <p className="text-slate-600">Phone: +91 {selectedCarpenter.phone}</p>
            <p className="text-slate-600">Aadhaar: {selectedCarpenter.aadhaar_number || '-'}</p>
            <p className="text-slate-600">PAN: {selectedCarpenter.pan_card || '-'}</p>
            <p className="text-slate-600">Location: {selectedCarpenter.city || '-'}, {selectedCarpenter.state || '-'}</p>
            <p className="text-slate-600">Tier: {selectedCarpenter.tier} • {selectedCarpenter.total_sheets || 0} sheets</p>
            <p className="text-slate-600">Points Balance: {selectedCarpenter.points_balance || 0} pts</p>

            <div className="pt-2 border-t border-slate-100 space-y-1">
              <h5 className="font-bold text-slate-800">Bank & UPI</h5>
              <p className="text-slate-600">UPI ID: {selectedCarpenter.upi_id || '-'}</p>
              <p className="text-slate-600">Bank: {selectedCarpenter.bank_name || '-'}</p>
              <p className="text-slate-600">Account No: {selectedCarpenter.account_number || '-'}</p>
              <p className="text-slate-600">IFSC: {selectedCarpenter.ifsc_code || '-'}</p>
            </div>

            {renderCarpenterModalActions()}
          </div>
        )}
      </Modal>

      {/* Payout Detail Modal */}
      <Modal isOpen={Boolean(selectedPayout)} onClose={() => setSelectedPayout(null)} title="Payout Request" maxWidth="md">
        {selectedPayout && (
          <div className="space-y-3 text-xs font-medium">
            <h4 className="text-base font-bold text-slate-900">Request from {selectedPayout.carpenter_name || 'User'}</h4>
            <p className="text-slate-600">Points Redeemed: {selectedPayout.points_redeemed}</p>
            <p className="text-slate-600">Payout Amount: ₹{selectedPayout.amount}</p>
            <p className="text-slate-600">Mode: {selectedPayout.payout_type}</p>
            <p className="text-slate-600">Status: {selectedPayout.status}</p>

            {selectedPayout.status === 'Requested' && (
              <div className="flex space-x-3 pt-3">
                <button
                  disabled={busyActionId === `payout-${selectedPayout.id}`}
                  onClick={() => handlePayoutAction(selectedPayout.id, 'Rejected')}
                  className="flex-1 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl"
                >
                  Reject
                </button>
                <button
                  disabled={busyActionId === `payout-${selectedPayout.id}`}
                  onClick={() => handlePayoutAction(selectedPayout.id, 'Approved')}
                  className="flex-1 py-2.5 bg-[#1E4620] hover:bg-[#163318] text-white font-bold text-xs rounded-xl"
                >
                  Mark Paid
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
