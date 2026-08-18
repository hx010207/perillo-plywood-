import React, { useState, useEffect } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { User, Stats } from '../../types';
import { updateProfile } from '../../services/api';
import { User as UserIcon, Phone, MapPin, CreditCard, ShieldCheck, Zap, Landmark, KeyRound, Edit3, CheckCircle2, AlertCircle } from 'lucide-react';
import { Modal } from '../../components/common/Modal';

interface ProfileTabProps {
  user: User;
  stats: Stats;
  onUpdateUser: (updatedUser: Partial<User>) => void;
  autoEdit?: boolean;
}

const TIER_ICONS: Record<string, string> = { Member: '📦', Bronze: '🥉', Silver: '🥈', Gold: '🥇', Platinum: '💎' };
const TIER_COLORS: Record<string, string> = { Member: '#94A3B8', Bronze: '#CD7F32', Silver: '#6B7280', Gold: '#F59E0B', Platinum: '#8B5CF6' };

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

  const tier = stats?.tier || 'Member';
  const totalSheets = stats?.totalSheets || 0;

  const renderField = (label: string, value?: string, icon?: React.ReactNode) => (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0 text-sm">
      <div className="flex items-center space-x-2.5 text-slate-500 font-medium">
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      <span className="font-bold text-slate-800 text-right">{value || t('notProvided')}</span>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24 sm:pb-8">
      {/* Avatar Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm text-center flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-[#1E4620] text-white font-black text-3xl flex items-center justify-center shadow-lg border-2 border-emerald-500/20 mb-3">
          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>
        <h2 className="text-2xl font-black text-slate-900">{user.name}</h2>
        <p className="text-xs font-semibold text-slate-400 mt-0.5">ID: {user.id}</p>

        {/* Status Badges */}
        <div className="flex items-center justify-center space-x-2 mt-3">
          {stats?.verified ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              {t('verified')}
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
              {t('pendingVerification')}
            </span>
          )}

          <span
            className="px-3 py-1 rounded-full text-xs font-bold border flex items-center space-x-1"
            style={{
              backgroundColor: `${TIER_COLORS[tier]}15`,
              borderColor: TIER_COLORS[tier],
              color: TIER_COLORS[tier],
            }}
          >
            <span>{TIER_ICONS[tier]}</span>
            <span>{tier}</span>
          </span>
        </div>
        <p className="text-xs font-semibold text-slate-400 mt-2">
          {totalSheets} {t('sheetsPurchased')}
        </p>
      </div>

      {/* View / Edit Form */}
      {!isEditing ? (
        <div className="space-y-6">
          {/* Personal Details */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-[#1E4620] uppercase tracking-wider">
                {t('personalDetails')}
              </h3>
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center space-x-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{t('editInfo')}</span>
              </button>
            </div>

            {renderField(t('mobile'), `+91 ${user.phone}`, <Phone className="w-4 h-4 text-emerald-700" />)}
            {renderField(t('region'), user.region, <MapPin className="w-4 h-4 text-emerald-700" />)}
            {renderField(t('aadhaar'), maskAadhaar(user.aadhaar_number), <ShieldCheck className="w-4 h-4 text-emerald-700" />)}
            {renderField(t('panCard'), maskPan(user.pan_card), <CreditCard className="w-4 h-4 text-emerald-700" />)}
          </div>

          {/* Bank & UPI Details */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
            <h3 className="text-sm font-bold text-[#1E4620] uppercase tracking-wider pb-2 border-b border-slate-100">
              {t('bankUpiDetails')}
            </h3>

            {renderField(t('upiId'), user.upi_id, <Zap className="w-4 h-4 text-amber-600" />)}
            {renderField(t('bankName'), user.bank_name, <Landmark className="w-4 h-4 text-sky-700" />)}
            {renderField(t('accountNumber'), user.account_number, <CreditCard className="w-4 h-4 text-sky-700" />)}
            {renderField(t('ifscCode'), user.ifsc_code, <KeyRound className="w-4 h-4 text-sky-700" />)}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#1E4620] uppercase tracking-wider pb-2 border-b border-slate-100">
              {t('editProfileTitle')}
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                {t('fullName')} *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('fullNamePlaceholder')}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                {t('region')}
              </label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder={t('regionPlaceholder')}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                {t('aadhaar')}
              </label>
              <input
                type="text"
                maxLength={12}
                value={aadhaarNumber}
                onChange={(e) => setAadhaarNumber(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder={t('aadhaarPlaceholder')}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                {t('panCardLabel')}
              </label>
              <input
                type="text"
                maxLength={10}
                value={panCard}
                onChange={(e) => setPanCard(e.target.value.toUpperCase())}
                placeholder={t('panCardPlaceholder')}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl bg-slate-50 text-sm font-medium uppercase focus:ring-2 focus:ring-emerald-700"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#1E4620] uppercase tracking-wider pb-2 border-b border-slate-100">
              {t('payoutBankSettings')}
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                {t('upiLabel')}
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder={t('upiPlaceholder')}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl bg-slate-50 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                {t('bankNameLabel')}
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder={t('bankNamePlaceholder')}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl bg-slate-50 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                {t('accountLabel')}
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder={t('accountPlaceholder')}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl bg-slate-50 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                {t('ifscLabel')}
              </label>
              <input
                type="text"
                value={ifscCode}
                onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                placeholder={t('ifscPlaceholder')}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl bg-slate-50 text-sm font-medium uppercase"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="flex-1 py-3 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] py-3 bg-[#1E4620] hover:bg-[#163318] text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-70"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
              ) : (
                <span>{t('saveDetails')}</span>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Alert Modal */}
      <Modal
        isOpen={alertState.isOpen}
        onClose={() => setAlertState({ ...alertState, isOpen: false })}
        title={alertState.title}
      >
        <div className="space-y-4">
          <p className="text-sm font-semibold text-slate-700">{alertState.message}</p>
          <div className="flex justify-end pt-2">
            <button
              onClick={() => setAlertState({ ...alertState, isOpen: false })}
              className="px-5 py-2.5 bg-[#1E4620] text-white font-bold text-xs rounded-xl shadow-sm"
            >
              {t('ok')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
