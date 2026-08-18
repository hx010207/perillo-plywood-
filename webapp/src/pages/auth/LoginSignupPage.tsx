import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { ShieldCheck, UserCheck, Smartphone, Lock, Mail, CreditCard, Building, Globe, ArrowRight, Sparkles, CheckCircle2, Award, Zap, Eye, EyeOff } from 'lucide-react';

export const LoginSignupPage: React.FC = () => {
  const { t, language, setLanguage, supportedLanguages } = useI18n();
  const { loginCarpenter, loginAdmin, signup, error: authError, busy } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [role, setRole] = useState<'carpenter' | 'admin'>('carpenter');

  // Login States
  const [phone, setPhone] = useState('');
  const [identifier, setIdentifier] = useState('admin@perillo.local');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Signup States
  const [name, setName] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [upiId, setUpiId] = useState('');
  const [panCard, setPanCard] = useState('');

  // Local Validation
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (role === 'admin') {
        if (!identifier.trim()) {
          setError('Admin email or username is required');
          setLoading(false);
          return;
        }
        if (!password.trim()) {
          setError('Admin password is required');
          setLoading(false);
          return;
        }
        await loginAdmin(identifier.trim(), password.trim());
      } else {
        if (!phone || phone.length < 10) {
          setError(t('invalidPhone'));
          setLoading(false);
          return;
        }
        await loginCarpenter(phone.trim());
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || authError || t('networkError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError(t('nameRequired'));
      return;
    }
    if (!signupPhone || signupPhone.length < 10) {
      setError(t('invalidPhone'));
      return;
    }
    if (!city.trim()) {
      setError(t('cityRequired'));
      return;
    }
    if (!state.trim()) {
      setError(t('stateRequired'));
      return;
    }
    if (!aadhaarNumber || aadhaarNumber.length < 12) {
      setError(t('aadhaarRequired'));
      return;
    }
    if (panCard.trim() && panCard.trim().length !== 10) {
      setError(t('panCardRequired'));
      return;
    }

    setLoading(true);
    try {
      await signup({
        name: name.trim(),
        phone: signupPhone,
        email: email.trim() || undefined,
        city: city.trim(),
        state: state.trim(),
        aadhaarNumber: aadhaarNumber.trim(),
        panCard: panCard.trim().toUpperCase() || undefined,
        bankName: bankName.trim() || undefined,
        accountNumber: accountNumber.trim() || undefined,
        ifscCode: ifscCode.trim() || undefined,
        upiId: upiId.trim() || undefined,
        preferredLanguage: language,
      });
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || authError || t('networkError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 bg-[radial-gradient(#1E4620_1px,transparent_1px)] [background-size:24px_24px]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md lg:max-w-xl">
        
        {/* Language Selection Chips */}
        <div className="flex flex-wrap justify-center items-center gap-2 mb-6">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-500 mr-1">
            <Globe className="w-3.5 h-3.5 text-emerald-800" />
            <span>Language:</span>
          </div>
          {supportedLanguages.map((item) => {
            const active = language === item.code;
            return (
              <button
                key={item.code}
                onClick={() => setLanguage(item.code)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                  active
                    ? 'bg-[#1E4620] text-white border-[#1E4620] shadow-sm scale-105'
                    : 'bg-white/90 text-slate-700 border-slate-300 hover:bg-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Main Card Container */}
        <div className="bg-white/95 backdrop-blur-md py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-slate-200/90">
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg border-2 border-emerald-500/30 bg-white p-1 mb-3">
              <img
                src="https://perilloplywood.in/wp-content/uploads/2025/06/cropped-footerlogo-270x270.jpg"
                alt="Perillo Logo"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#1E4620] tracking-tight">{t('appName')}</h2>
            <p className="text-xs sm:text-sm font-bold text-slate-600 mt-1">
              {mode === 'login' ? t('loyaltyProgram') : t('createAccount')}
            </p>
          </div>

          {/* Value Prop Badges */}
          {mode === 'login' && role === 'carpenter' && (
            <div className="grid grid-cols-3 gap-2 mb-6 p-3 bg-emerald-50/70 border border-emerald-200/70 rounded-2xl text-center">
              <div className="space-y-0.5">
                <Zap className="w-4 h-4 text-amber-600 mx-auto" />
                <p className="text-[10px] font-black text-[#1E4620] uppercase">Instant</p>
                <p className="text-[9px] text-slate-500 font-bold">Cashback</p>
              </div>
              <div className="space-y-0.5 border-x border-emerald-200/60">
                <Award className="w-4 h-4 text-emerald-700 mx-auto" />
                <p className="text-[10px] font-black text-[#1E4620] uppercase">VIP Tiers</p>
                <p className="text-[9px] text-slate-500 font-bold">Up to 2.5%</p>
              </div>
              <div className="space-y-0.5">
                <ShieldCheck className="w-4 h-4 text-emerald-800 mx-auto" />
                <p className="text-[10px] font-black text-[#1E4620] uppercase">Official</p>
                <p className="text-[9px] text-slate-500 font-bold">Perillo Pass</p>
              </div>
            </div>
          )}

          {mode === 'login' ? (
            <>
              {/* Role Toggle Switch */}
              <div className="flex rounded-2xl bg-slate-100 p-1.5 mb-6 border border-slate-200 shadow-inner">
                <button
                  type="button"
                  onClick={() => { setRole('carpenter'); setError(''); }}
                  className={`flex-1 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center space-x-2 ${
                    role === 'carpenter'
                      ? 'bg-[#1E4620] text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{t('roleUser')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setRole('admin'); setError(''); }}
                  className={`flex-1 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center space-x-2 ${
                    role === 'admin'
                      ? 'bg-[#1E4620] text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{t('roleAdmin')}</span>
                </button>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {role === 'admin' ? (
                  <>
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide mb-1.5">
                        Admin Email / Identifier
                      </label>
                      <div className="relative rounded-xl shadow-xs">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          required
                          value={identifier}
                          onChange={(e) => { setIdentifier(e.target.value); setError(''); }}
                          placeholder="admin@perillo.local"
                          className="block w-full pl-10 pr-3.5 py-3 border border-slate-300 rounded-xl bg-slate-50 text-slate-900 text-sm font-semibold focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide mb-1.5">
                        Admin Password
                      </label>
                      <div className="relative rounded-xl shadow-xs">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => { setPassword(e.target.value); setError(''); }}
                          placeholder="••••••••"
                          className="block w-full pl-10 pr-11 py-3 border border-slate-300 rounded-xl bg-slate-50 text-slate-900 text-sm font-semibold focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 focus:outline-none transition-colors"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          title={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4 text-emerald-800" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide mb-1.5">
                      {t('enterMobile')}
                    </label>
                    <div className="flex rounded-xl shadow-xs border border-slate-300 overflow-hidden bg-slate-50 focus-within:ring-2 focus-within:ring-emerald-700 focus-within:bg-white transition-all">
                      <span className="inline-flex items-center px-4 bg-slate-100 text-[#1E4620] font-black text-sm border-r border-slate-300">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        required
                        value={phone}
                        onChange={(e) => { setPhone(e.target.value.replace(/[^0-9]/g, '')); setError(''); }}
                        placeholder="98765 43210"
                        className="block w-full px-3.5 py-3 text-slate-900 text-base font-bold bg-transparent border-0 focus:outline-none tracking-wider"
                      />
                    </div>
                  </div>
                )}

                {(error || authError) && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 text-center">
                    {error || authError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || busy}
                  className="w-full py-3.5 px-4 bg-[#1E4620] hover:bg-[#153417] text-white font-black text-sm rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-70 flex items-center justify-center space-x-2"
                >
                  {loading || busy ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{role === 'admin' ? 'Login to Admin Dashboard' : t('continueBtn')}</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>

                {role === 'carpenter' && (
                  <div className="text-center pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => { setMode('signup'); setError(''); }}
                      className="text-xs font-extrabold text-[#D97706] hover:text-[#B45309] hover:underline"
                    >
                      {t('signUpLink')}
                    </button>
                  </div>
                )}
              </form>
            </>
          ) : (
            /* Carpenter Multi-step KYC Signup Form */
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide mb-1">
                  {t('fullName')} *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(''); }}
                  placeholder={t('fullNamePlaceholder')}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-slate-50 text-slate-900 text-sm font-semibold focus:ring-2 focus:ring-emerald-700 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide mb-1">
                  {t('enterMobile')} *
                </label>
                <div className="flex rounded-xl border border-slate-300 overflow-hidden bg-slate-50">
                  <span className="inline-flex items-center px-3.5 bg-slate-100 text-[#1E4620] font-black text-xs border-r border-slate-300">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    required
                    value={signupPhone}
                    onChange={(e) => { setSignupPhone(e.target.value.replace(/[^0-9]/g, '')); setError(''); }}
                    placeholder="98765 43210"
                    className="w-full px-3 py-2.5 text-slate-900 text-sm font-bold bg-transparent border-0 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="example@mail.com"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-slate-50 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-emerald-700 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide mb-1">
                    {t('cityLabel')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => { setCity(e.target.value); setError(''); }}
                    placeholder={t('enterCity')}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-slate-50 text-slate-900 text-sm font-semibold focus:ring-2 focus:ring-emerald-700 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide mb-1">
                    {t('stateLabel')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => { setState(e.target.value); setError(''); }}
                    placeholder={t('enterState')}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-slate-50 text-slate-900 text-sm font-semibold focus:ring-2 focus:ring-emerald-700 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide mb-1">
                    {t('aadhaar')} *
                  </label>
                  <input
                    type="text"
                    maxLength={12}
                    required
                    value={aadhaarNumber}
                    onChange={(e) => { setAadhaarNumber(e.target.value.replace(/[^0-9]/g, '')); setError(''); }}
                    placeholder="12-digit Aadhaar"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-slate-50 text-slate-900 text-sm font-semibold focus:ring-2 focus:ring-emerald-700 focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide mb-1">
                    {t('panCardLabel')}
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={panCard}
                    onChange={(e) => { setPanCard(e.target.value.toUpperCase()); setError(''); }}
                    placeholder="ABCDE1234F"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-slate-50 text-slate-900 text-sm font-semibold focus:ring-2 focus:ring-emerald-700 focus:bg-white font-mono uppercase"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200">
                <h4 className="text-xs font-black text-[#1E4620] uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>{t('bankUpiDetails')}</span>
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">{t('upiId')} (For Instant Payout)</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="mobile@upi"
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl bg-slate-50 text-xs font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">{t('bankName')}</label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="State Bank of India"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">{t('ifscCode')}</label>
                      <input
                        type="text"
                        value={ifscCode}
                        onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                        placeholder="SBIN0001234"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 text-xs font-semibold font-mono uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">{t('accountNumber')}</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="Account number"
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl bg-slate-50 text-xs font-semibold font-mono"
                    />
                  </div>
                </div>
              </div>

              {(error || authError) && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 text-center">
                  {error || authError}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || busy}
                className="w-full py-3.5 px-4 bg-[#1E4620] hover:bg-[#153417] text-white font-black text-sm rounded-xl shadow-md transition-all active:scale-[0.99] disabled:opacity-70 flex items-center justify-center space-x-2"
              >
                {loading || busy ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>{t('registerBtn')}</span>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); }}
                  className="text-xs font-extrabold text-[#D97706] hover:underline"
                >
                  {t('loginLink')}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-slate-500 font-bold mt-6">{t('securePayouts')}</p>
      </div>
    </div>
  );
};
