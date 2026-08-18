import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { useTheme } from '../../contexts/ThemeContext';
import { ShieldCheck, UserCheck, Smartphone, Lock, Mail, Globe, ArrowRight, Award, Zap, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { GradientWaves } from '../../components/reactbits/GradientWaves';

interface LoginSignupPageProps {
  initialRole?: 'carpenter' | 'admin';
}

export const LoginSignupPage: React.FC<LoginSignupPageProps> = ({
  initialRole = 'carpenter',
}) => {
  const { t, language, setLanguage, supportedLanguages } = useI18n();
  const { loginCarpenter, loginAdmin, signup, error: authError, busy } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [role, setRole] = useState<'carpenter' | 'admin'>(initialRole);

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
    <div className="relative w-full min-h-screen selection:bg-[#8C6D58] selection:text-white">
      {/* 1. Full-Screen Backdrop GradientWaves (Warm Beige/Linen) */}
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none overflow-hidden">
        <GradientWaves
          horizonColor="#FAF7F2"
          waveColor="#D9C5B2"
          crestColor="#8C6D58"
          brightness={1.1}
          opacity={0.9}
          speed={0.35}
        />
      </div>

      {/* 2. Foreground Main Content */}
      <main className="relative z-10 w-full min-h-screen flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 text-[#2A1E17] dark:text-[#FAF7F2]">
        <div className="sm:mx-auto sm:w-full sm:max-w-md lg:max-w-lg">
          {/* Top Controls: Language & Theme Switcher */}
          <div className="flex flex-wrap justify-center items-center gap-2 mb-6">
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-full bg-[#FAF7F2]/80 dark:bg-white/5 border border-[#8C6D58]/25 text-[#6B5A4E] dark:text-slate-200 shadow-xs mr-1"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-[#8C6D58]" />}
            </button>

            <div className="flex items-center space-x-1.5 text-xs text-[#6B5A4E] dark:text-slate-400 mr-1 font-semibold">
              <Globe className="w-3.5 h-3.5 text-[#8C6D58]" />
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
                      ? 'bg-[#8C6D58] text-white border-[#8C6D58] shadow-md ring-2 ring-[#8C6D58]/20 scale-105'
                      : 'bg-[#FAF7F2]/80 dark:bg-white/5 text-[#6B5A4E] dark:text-slate-300 border-[#8C6D58]/20 hover:bg-white dark:hover:bg-white/10'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Main Card Container (Frosted Light-Beige Card with Soft Timber Dotted Line) */}
          <div className="relative rounded-3xl bg-[#FAF7F2]/90 dark:bg-[#261C16]/90 backdrop-blur-md border border-[#8C6D58]/20 p-6 sm:p-10 shadow-lg shadow-stone-900/5 space-y-6 transition-all duration-300 before:absolute before:inset-2 before:border before:border-dashed before:border-[#8C6D58]/30 dark:before:border-[#D9C5B2]/20 before:pointer-events-none before:rounded-2xl">
            <div className="relative z-10 space-y-6">
              {/* Logo & Header */}
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg border-2 border-white ring-2 ring-[#8C6D58]/40 bg-white p-1 mb-3">
                  <img
                    src="https://perilloplywood.in/wp-content/uploads/2025/06/cropped-footerlogo-270x270.jpg"
                    alt="Perillo Logo"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#2A1E17] dark:text-[#FAF7F2] tracking-tight">
                  {t('appName')}
                </h2>
                <p className="text-xs sm:text-sm font-bold text-[#8C6D58] dark:text-[#D9C5B2] mt-1">
                  {mode === 'login' ? t('loyaltyProgram') : t('createAccount')}
                </p>
              </div>

              {/* Value Prop Badges */}
              {mode === 'login' && role === 'carpenter' && (
                <div className="grid grid-cols-3 gap-2 p-3.5 bg-white/70 dark:bg-[#1E1612] border border-[#8C6D58]/20 rounded-xl text-center">
                  <div className="space-y-0.5">
                    <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400 mx-auto" />
                    <p className="text-[10px] font-black text-[#2A1E17] dark:text-white uppercase">Instant</p>
                    <p className="text-[9px] text-[#6B5A4E] dark:text-slate-400 font-semibold">Cashback</p>
                  </div>
                  <div className="space-y-0.5 border-x border-[#8C6D58]/20">
                    <Award className="w-4 h-4 text-[#8C6D58] dark:text-[#D9C5B2] mx-auto" />
                    <p className="text-[10px] font-black text-[#2A1E17] dark:text-white uppercase">VIP Tiers</p>
                    <p className="text-[9px] text-[#6B5A4E] dark:text-slate-400 font-semibold">Up to 2.5%</p>
                  </div>
                  <div className="space-y-0.5">
                    <ShieldCheck className="w-4 h-4 text-[#065F46] dark:text-emerald-400 mx-auto" />
                    <p className="text-[10px] font-black text-[#2A1E17] dark:text-white uppercase">Official</p>
                    <p className="text-[9px] text-[#6B5A4E] dark:text-slate-400 font-semibold">Perillo Pass</p>
                  </div>
                </div>
              )}

              {mode === 'login' ? (
                <>
                  {/* Role Toggle Switch */}
                  <div className="flex rounded-xl bg-stone-200/60 dark:bg-[#1E1612] p-1.5 border border-[#8C6D58]/20 shadow-inner">
                    <button
                      type="button"
                      onClick={() => { setRole('carpenter'); setError(''); }}
                      className={`flex-1 py-2.5 rounded-lg font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center space-x-2 ${
                        role === 'carpenter'
                          ? 'bg-[#8C6D58] text-white shadow-md ring-2 ring-[#8C6D58]/20'
                          : 'text-[#6B5A4E] hover:text-[#2A1E17] dark:text-slate-400 dark:hover:text-white'
                      }`}
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>{t('roleUser')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setRole('admin'); setError(''); }}
                      className={`flex-1 py-2.5 rounded-lg font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center space-x-2 ${
                        role === 'admin'
                          ? 'bg-[#8C6D58] text-white shadow-md ring-2 ring-[#8C6D58]/20'
                          : 'text-[#6B5A4E] hover:text-[#2A1E17] dark:text-slate-400 dark:hover:text-white'
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
                          <label className="form-label">
                            Admin Email / Identifier
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C6D58]/60">
                              <Mail className="w-4 h-4" />
                            </div>
                            <input
                              type="text"
                              required
                              value={identifier}
                              onChange={(e) => { setIdentifier(e.target.value); setError(''); }}
                              placeholder="admin@perillo.local"
                              className="form-input-field pl-10 font-bold"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="form-label">
                            Admin Password
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C6D58]/60">
                              <Lock className="w-4 h-4" />
                            </div>
                            <input
                              type={showPassword ? 'text' : 'password'}
                              required
                              value={password}
                              onChange={(e) => { setPassword(e.target.value); setError(''); }}
                              placeholder="••••••••"
                              className="form-input-field pl-10 pr-11 font-bold"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#6B5A4E] hover:text-[#2A1E17] dark:hover:text-white"
                              title={showPassword ? 'Hide password' : 'Show password'}
                            >
                              {showPassword ? <EyeOff className="w-4 h-4 text-[#8C6D58]" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div>
                        <label className="form-label">
                          {t('enterMobile')}
                        </label>
                        <div className="flex rounded-xl border border-[#8C6D58]/30 overflow-hidden bg-white dark:bg-[#1E1612] focus-within:border-[#8C6D58]">
                          <span className="inline-flex items-center px-4 bg-[#8C6D58]/15 text-[#8C6D58] dark:text-[#D9C5B2] font-black text-sm border-r border-[#8C6D58]/20">
                            +91
                          </span>
                          <input
                            type="tel"
                            maxLength={10}
                            required
                            value={phone}
                            onChange={(e) => { setPhone(e.target.value.replace(/[^0-9]/g, '')); setError(''); }}
                            placeholder="98765 43210"
                            className="block w-full px-3.5 py-3 text-[#2A1E17] dark:text-white text-base font-black bg-transparent border-0 focus:outline-none placeholder-[#8C6D58]/40"
                          />
                        </div>
                      </div>
                    )}

                    {(error || authError) && (
                      <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-400/30 text-xs font-bold text-rose-700 dark:text-rose-300 text-center">
                        {error || authError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading || busy}
                      className="btn-primary-timber w-full py-4 uppercase text-sm tracking-wider font-black flex items-center justify-center space-x-2 disabled:opacity-70 border-2 border-white/40"
                    >
                      {loading || busy ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>{role === 'admin' ? 'Login as Admin' : t('continueBtn')}</span>
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </>
                      )}
                    </button>

                    {role === 'carpenter' && (
                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => { setMode('signup'); setError(''); }}
                          className="text-xs font-extrabold text-[#8C6D58] dark:text-[#D9C5B2] hover:underline"
                        >
                          {t('signUpLink')}
                        </button>
                      </div>
                    )}
                  </form>
                </>
              ) : (
                /* Carpenter Signup Form */
                <form onSubmit={handleSignupSubmit} className="space-y-4">
                  <div>
                    <label className="form-label">
                      {t('fullName')} *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => { setName(e.target.value); setError(''); }}
                      placeholder={t('fullNamePlaceholder')}
                      className="form-input-field font-bold"
                    />
                  </div>

                  <div>
                    <label className="form-label">
                      {t('enterMobile')} *
                    </label>
                    <div className="flex rounded-xl border border-[#8C6D58]/30 overflow-hidden bg-white dark:bg-[#1E1612]">
                      <span className="inline-flex items-center px-3.5 bg-[#8C6D58]/15 text-[#8C6D58] dark:text-[#D9C5B2] font-black text-xs border-r border-[#8C6D58]/20">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        required
                        value={signupPhone}
                        onChange={(e) => { setSignupPhone(e.target.value.replace(/[^0-9]/g, '')); setError(''); }}
                        placeholder="98765 43210"
                        className="w-full px-3 py-3 text-[#2A1E17] dark:text-white text-sm font-bold bg-transparent border-0 focus:outline-none placeholder-[#8C6D58]/40"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">
                        {t('cityLabel')} *
                      </label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => { setCity(e.target.value); setError(''); }}
                        placeholder={t('enterCity')}
                        className="form-input-field font-semibold"
                      />
                    </div>
                    <div>
                      <label className="form-label">
                        {t('stateLabel')} *
                      </label>
                      <input
                        type="text"
                        required
                        value={state}
                        onChange={(e) => { setState(e.target.value); setError(''); }}
                        placeholder={t('enterState')}
                        className="form-input-field font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">
                        {t('aadhaar')} *
                      </label>
                      <input
                        type="text"
                        maxLength={12}
                        required
                        value={aadhaarNumber}
                        onChange={(e) => { setAadhaarNumber(e.target.value.replace(/[^0-9]/g, '')); setError(''); }}
                        placeholder="12-digit Aadhaar"
                        className="form-input-field font-bold"
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
                        onChange={(e) => { setPanCard(e.target.value.toUpperCase()); setError(''); }}
                        placeholder="ABCDE1234F"
                        className="form-input-field uppercase font-bold"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#8C6D58]/15 dark:border-white/10 space-y-3">
                    <label className="form-label text-[#8C6D58] dark:text-[#D9C5B2] font-bold">
                      UPI ID (For Instant Payout)
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="mobile@upi"
                      className="form-input-field font-semibold"
                    />
                  </div>

                  {(error || authError) && (
                    <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-400/30 text-xs font-bold text-rose-700 dark:text-rose-300 text-center">
                      {error || authError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || busy}
                    className="btn-primary-timber w-full py-4 uppercase text-sm tracking-wider font-black disabled:opacity-70 border-2 border-white/40"
                  >
                    {loading || busy ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                    ) : (
                      <span>{t('registerBtn')}</span>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => { setMode('login'); setError(''); }}
                      className="text-xs font-extrabold text-[#8C6D58] dark:text-[#D9C5B2] hover:underline"
                    >
                      {t('loginLink')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-[#6B5A4E] dark:text-[#C4B5A5] font-semibold mt-6">{t('securePayouts')}</p>
        </div>
      </main>
    </div>
  );
};
