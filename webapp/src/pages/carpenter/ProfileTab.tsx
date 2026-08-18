import React, { useState, useEffect } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { User, Stats } from '../../types';
import { updateProfile } from '../../services/api';
import { User as UserIcon, ShieldCheck, Landmark, Edit3 } from 'lucide-react';
import { Modal } from '../../components/common/Modal';

interface ProfileTabProps {
  user: User;
  stats: Stats;
  onUpdateUser: (updatedUser: Partial<User>) => void;
  autoEdit?: boolean;
}

const TIER_ICONS: Record<string, string> = { Member: '🪵', Bronze: '🥉', Silver: '🥈', Gold: '🥇', Platinum: '💎' };

export const ProfileTab: React.FC<ProfileTabProps> = ({
  user,
  stats,
  onUpdateUser,
  autoEdit = false,
}) => {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(autoEdit);

  const [name, setName] = useState(user.name || '');
  const [region, setRegion] = useState(user.region || '');
  const [upiId, setUpiId] = useState(user.upi_id || '');
  const [bankName, setBankName] = useState(user.bank_name || '');
  const [accountNumber, setAccountNumber] = useState(user.account_number || '');
  const [ifscCode, setIfscCode] = useState(user.ifsc_code || '');
  const [aadhaarNumber, setAadhaarNumber] = useState(user.aadhaar_number || '');
  const [panCard, setPanCard] = useState(user.pan_card || '');

  const [alertState, setAlertState] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false,
    title: '',
    message: '',
  });

  useEffect(() => {
    setName(user.name || '');
    setRegion(user.region || '');
    setUpiId(user.upi_id || '');
    setBankName(user.bank_name || '');
    setAccountNumber(user.account_number || '');
    setIfscCode(user.ifsc_code || '');
    setAadhaarNumber(user.aadhaar_number || '');
    setPanCard(user.pan_card || '');
    if (autoEdit) {
      setIsEditing(true);
    }
  }, [user, autoEdit]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setAlertState({ isOpen: true, title: t('error'), message: t('nameRequired') });
      return;
    }
    setLoading(true);

    try {
      const data = await updateProfile(user.id, {
        name: name.trim(),
        region: region.trim(),
        upi_id: upiId.trim(),
        bank_name: bankName.trim(),
        account_number: accountNumber.trim(),
        ifsc_code: ifscCode.trim(),
        aadhaar_number: aadhaarNumber.trim(),
        pan_card: panCard.trim().toUpperCase() || undefined,
      });

      if (data.success && data.user) {
        onUpdateUser(data.user);
        setIsEditing(false);
        setAlertState({ isOpen: true, title: t('success'), message: t('profileUpdated') });
      } else {
        setAlertState({ isOpen: true, title: t('error'), message: data.error || t('profileUpdateFailed') });
      }
    } catch (err: any) {
      console.error('Update profile error:', err);
      setAlertState({ isOpen: true, title: t('error'), message: t('profileSaveError') });
    } finally {
      setLoading(false);
    }
  };

  const maskAadhaar = (val?: string) => {
    if (!val || val.length < 4) return val || t('notProvided');
    return '•••• •••• ' + val.slice(-4);
  };

  const maskPan = (val?: string) => {
    if (!val || val.length < 4) return val || t('notProvided');
    return '••••••' + val.slice(-4);
  };

  return (
    <div className="space-y-6 pb-28 sm:pb-12 max-w-4xl mx-auto text-[#2A1E17] dark:text-[#FAF7F2]">
      {/* 1. User Summary Profile Card */}
      <div className="relative rounded-2xl bg-[#FAF7F2]/90 dark:bg-[#261C16]/90 backdrop-blur-md border border-[#8C6D58]/20 p-6 sm:p-8 shadow-lg shadow-stone-900/5 space-y-6 transition-all duration-300 before:absolute before:inset-2 before:border before:border-dashed before:border-[#8C6D58]/30 dark:before:border-[#D9C5B2]/20 before:pointer-events-none before:rounded-xl">
        <div className="relative z-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              {/* Perfect Circle Avatar Badge */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#8C6D58] via-[#735542] to-[#2A1E17] flex items-center justify-center text-white font-black text-2xl shadow-md border-2 border-white ring-2 ring-[#8C6D58]/40 flex-shrink-0">
                {(user.name || 'R').charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-xl sm:text-2xl font-black text-[#2A1E17] dark:text-[#FAF7F2] tracking-tight">{user.name || 'Carpenter'}</h3>
                  {stats.verified && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#10B981]/15 text-[#065F46] dark:text-emerald-300 border border-[#10B981]/30">
                      <ShieldCheck className="w-3 h-3 mr-1 text-[#065F46] dark:text-emerald-400" />
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-[#6B5A4E] dark:text-[#C4B5A5] mt-0.5">
                  {user.phone ? `+91 ${user.phone}` : ''} • ID: {user.id}
                </p>
                <p className="text-xs text-[#8C6D58] dark:text-[#D9C5B2] font-bold mt-0.5">
                  {user.region ? `📍 ${user.region}` : 'Hubballi Region'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 rounded-xl bg-white/70 hover:bg-white dark:bg-white/5 dark:hover:bg-white/10 text-[#8C6D58] dark:text-[#D9C5B2] text-xs font-bold transition-all border border-[#8C6D58]/20 flex items-center space-x-1.5 self-start sm:self-auto shadow-xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? t('cancel') : t('editProfile')}</span>
            </button>
          </div>

          {/* Tier Status & Sheet Counter */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-[#8C6D58]/15 dark:border-white/10 text-xs">
            <div className="p-3.5 rounded-xl bg-white/70 dark:bg-[#1E1612] border border-[#8C6D58]/20 transition-colors">
              <span className="text-[10px] font-bold text-[#6B5A4E] dark:text-stone-400 uppercase tracking-wide">Loyalty Tier</span>
              <p className="text-sm font-black text-[#8C6D58] dark:text-[#D9C5B2] mt-0.5 flex items-center space-x-1">
                <span>{TIER_ICONS[stats.tier] || '🪵'}</span>
                <span>{stats.tier} Tier</span>
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/70 dark:bg-[#1E1612] border border-[#8C6D58]/20 transition-colors">
              <span className="text-[10px] font-bold text-[#6B5A4E] dark:text-stone-400 uppercase tracking-wide">Verified Sheets</span>
              <p className="text-sm font-black text-[#2A1E17] dark:text-[#FAF7F2] mt-0.5">{stats.totalSheets || 0} Sheets</p>
            </div>
            <div className="col-span-2 sm:col-span-1 p-3.5 rounded-xl bg-white/70 dark:bg-[#1E1612] border border-[#8C6D58]/20 transition-colors">
              <span className="text-[10px] font-bold text-[#6B5A4E] dark:text-stone-400 uppercase tracking-wide">Cashback Rate</span>
              <p className="text-sm font-black text-[#8C6D58] dark:text-[#D9C5B2] mt-0.5">{stats.tierRewardPct || 0.8}% per sheet</p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Mode Form */}
      {isEditing ? (
        <div className="relative rounded-2xl bg-[#FAF7F2]/90 dark:bg-[#261C16]/90 backdrop-blur-md border border-[#8C6D58]/20 p-6 sm:p-8 shadow-lg shadow-stone-900/5 space-y-6 transition-all duration-300 before:absolute before:inset-2 before:border before:border-dashed before:border-[#8C6D58]/30 dark:before:border-[#D9C5B2]/20 before:pointer-events-none before:rounded-xl">
          <div className="relative z-10 space-y-6">
            <h4 className="section-heading">
              Edit KYC & Bank Profile
            </h4>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="form-label">
                  {t('fullName')} *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input-field font-bold"
                />
              </div>

              <div>
                <label className="form-label">
                  {t('regionLabel')}
                </label>
                <input
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="e.g. Hubballi, Karnataka"
                  className="form-input-field font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">
                    {t('aadhaar')}
                  </label>
                  <input
                    type="text"
                    maxLength={12}
                    value={aadhaarNumber}
                    onChange={(e) => setAadhaarNumber(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="12-digit Aadhaar"
                    className="form-input-field font-semibold"
                  />
                </div>

                <div>
                  <label className="form-label">
                    {t('panCardLabel')}
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={panCard}
                    onChange={(e) => setPanCard(e.target.value.toUpperCase())}
                    placeholder="ABCDE1234F"
                    className="form-input-field uppercase font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#8C6D58]/15 dark:border-white/10">
                <h5 className="section-heading mb-3">Bank & UPI Details</h5>
                <div className="space-y-3">
                  <div>
                    <label className="form-label">{t('upiId')}</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="mobile@upi"
                      className="form-input-field"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">{t('bankName')}</label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="State Bank of India"
                        className="form-input-field"
                      />
                    </div>

                    <div>
                      <label className="form-label">{t('ifscCode')}</label>
                      <input
                        type="text"
                        value={ifscCode}
                        onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                        placeholder="SBIN0001234"
                        className="form-input-field uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">{t('accountNumber')}</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="Account Number"
                      className="form-input-field"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-3 rounded-xl bg-white/70 dark:bg-white/5 hover:bg-white text-[#6B5A4E] dark:text-stone-300 font-bold text-xs transition-colors border border-[#8C6D58]/20"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary-timber px-7 py-3 text-xs uppercase tracking-wider font-black disabled:opacity-50 border-2 border-white/40"
                >
                  {loading ? 'Saving...' : t('saveChanges')}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        /* Read-Only View */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Personal Details */}
          <div className="relative rounded-2xl bg-[#FAF7F2]/90 dark:bg-[#261C16]/90 backdrop-blur-md border border-[#8C6D58]/20 p-6 shadow-lg shadow-stone-900/5 space-y-4 transition-all duration-300 before:absolute before:inset-1.5 before:border before:border-dashed before:border-[#8C6D58]/30 dark:before:border-[#D9C5B2]/20 before:pointer-events-none before:rounded-xl">
            <div className="relative z-10 space-y-4">
              <h4 className="section-heading flex items-center space-x-2">
                <UserIcon className="w-4 h-4" />
                <span>Personal KYC Details</span>
              </h4>

              <div className="space-y-3 text-xs divide-y divide-[#8C6D58]/15 dark:divide-white/10">
                <div className="pt-2 flex justify-between">
                  <span className="text-[#6B5A4E] dark:text-stone-400">Mobile</span>
                  <span className="font-bold text-[#2A1E17] dark:text-[#FAF7F2]">+91 {user.phone}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-[#6B5A4E] dark:text-stone-400">Region</span>
                  <span className="font-semibold text-[#2A1E17] dark:text-[#FAF7F2]">{user.region || 'Hubballi, Karnataka'}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-[#6B5A4E] dark:text-stone-400">Aadhaar Card</span>
                  <span className="text-[#8C6D58] dark:text-[#D9C5B2] font-bold">{maskAadhaar(user.aadhaar_number)}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-[#6B5A4E] dark:text-stone-400">PAN Card</span>
                  <span className="text-[#8C6D58] dark:text-[#D9C5B2] font-bold">{maskPan(user.pan_card)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bank & UPI Details */}
          <div className="relative rounded-2xl bg-[#FAF7F2]/90 dark:bg-[#261C16]/90 backdrop-blur-md border border-[#8C6D58]/20 p-6 shadow-lg shadow-stone-900/5 space-y-4 transition-all duration-300 before:absolute before:inset-1.5 before:border before:border-dashed before:border-[#8C6D58]/30 dark:before:border-[#D9C5B2]/20 before:pointer-events-none before:rounded-xl">
            <div className="relative z-10 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#8C6D58] dark:text-[#D9C5B2] flex items-center space-x-2">
                <Landmark className="w-4 h-4" />
                <span>Bank & UPI Details</span>
              </h4>

              <div className="space-y-3 text-xs divide-y divide-[#8C6D58]/15 dark:divide-white/10">
                <div className="pt-2 flex justify-between">
                  <span className="text-[#6B5A4E] dark:text-stone-400">UPI ID</span>
                  <span className="text-[#8C6D58] dark:text-[#D9C5B2] font-bold">{user.upi_id || 'Not Set'}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-[#6B5A4E] dark:text-stone-400">Bank Name</span>
                  <span className="font-semibold text-[#2A1E17] dark:text-[#FAF7F2]">{user.bank_name || 'Not Set'}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-[#6B5A4E] dark:text-stone-400">Account Number</span>
                  <span className="font-bold text-[#2A1E17] dark:text-[#FAF7F2]">
                    {user.account_number ? `•••• •••• ${user.account_number.slice(-4)}` : 'Not Set'}
                  </span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-[#6B5A4E] dark:text-stone-400">IFSC Code</span>
                  <span className="font-bold text-[#2A1E17] dark:text-[#FAF7F2]">{user.ifsc_code || 'Not Set'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      <Modal
        isOpen={alertState.isOpen}
        onClose={() => setAlertState({ ...alertState, isOpen: false })}
        title={alertState.title}
      >
        <div className="space-y-4 text-[#2A1E17] dark:text-stone-200">
          <p className="text-sm font-semibold leading-relaxed">{alertState.message}</p>
          <div className="flex justify-end pt-2">
            <button
              onClick={() => setAlertState({ ...alertState, isOpen: false })}
              className="px-6 py-2.5 bg-[#8C6D58] hover:bg-[#735542] text-white font-bold text-xs rounded-xl shadow-md"
            >
              {t('ok')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
