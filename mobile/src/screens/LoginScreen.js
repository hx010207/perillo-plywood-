import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';

export default function LoginScreen() {
  const { t, language, setLanguage, supportedLanguages } = useI18n();
  const { loginCarpenter, loginAdmin, signup, error: authError, busy } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [role, setRole] = useState('carpenter'); // 'carpenter' | 'admin'

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

  // Local validation/error states
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async () => {
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
        await loginCarpenter(phone);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || authError || t('networkError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async () => {
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
        preferredLanguage: language
      });
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || authError || t('networkError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          {/* Language Selection Chips */}
          <View style={styles.languageRow}>
            {supportedLanguages.map((item) => {
              const active = language === item.code;
              return (
                <TouchableOpacity
                  key={item.code}
                  style={[styles.languageChip, active && styles.languageChipActive]}
                  onPress={() => setLanguage(item.code)}
                >
                  <Text style={[styles.languageChipText, active && styles.languageChipTextActive]}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Brand Logo & App Identity */}
          <Image 
            source={{ uri: 'https://perilloplywood.in/wp-content/uploads/2025/06/cropped-footerlogo-270x270.jpg' }} 
            style={styles.logo}
            resizeMode="contain"
          />
          
          <Text style={styles.title}>{t('appName')}</Text>
          <Text style={styles.subtitle}>
            {mode === 'login' ? t('loyaltyProgram') : t('createAccount')}
          </Text>

          {mode === 'login' ? (
            <>
              {/* Role Picker for Login */}
              <View style={styles.roleRow}>
                <TouchableOpacity
                  style={[styles.roleChip, role === 'carpenter' && styles.roleChipActive]}
                  onPress={() => setRole('carpenter')}
                >
                  <Text style={[styles.roleChipText, role === 'carpenter' && styles.roleChipTextActive]}>{t('roleUser')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleChip, role === 'admin' && styles.roleChipActive]}
                  onPress={() => setRole('admin')}
                >
                  <Text style={[styles.roleChipText, role === 'admin' && styles.roleChipTextActive]}>{t('roleAdmin')}</Text>
                </TouchableOpacity>
              </View>

              {/* Login Form */}
              <View style={styles.form}>
                {role === 'admin' ? (
                  <>
                    <Text style={styles.inputLabel}>Admin Email / Username</Text>
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.input}
                        placeholder="admin@perillo.local"
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={identifier}
                        onChangeText={(text) => {
                          setIdentifier(text);
                          setError('');
                        }}
                      />
                    </View>

                    <Text style={[styles.inputLabel, styles.inputGap]}>Admin Password</Text>
                    <View style={[styles.inputContainer, { flexDirection: 'row', alignItems: 'center' }]}>
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder="Password"
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={(text) => {
                          setPassword(text);
                          setError('');
                        }}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={{ paddingHorizontal: 12, paddingVertical: 8 }}
                      >
                        <Text style={{ fontSize: 16 }}>{showPassword ? '👁️' : '🙈'}</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={styles.inputLabel}>{t('enterMobile')}</Text>
                    <View style={styles.inputContainer}>
                      <Text style={styles.countryCode}>+91</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="98765 43210"
                        keyboardType="phone-pad"
                        maxLength={10}
                        value={phone}
                        onChangeText={(text) => {
                          setPhone(text.replace(/[^0-9]/g, ''));
                          setError('');
                        }}
                      />
                    </View>
                  </>
                )}

                {/* Submit Action */}
                {(error || authError) ? <Text style={styles.errorText}>{error || authError}</Text> : null}

                <TouchableOpacity 
                  style={[styles.button, (loading || busy) && styles.buttonDisabled]} 
                  onPress={handleLoginSubmit}
                  disabled={loading || busy}
                >
                  {loading || busy ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.buttonText}>{role === 'admin' ? 'Login as Admin' : t('continueBtn')}</Text>
                  )}
                </TouchableOpacity>

                {role === 'carpenter' && (
                  <TouchableOpacity style={styles.switchModeLink} onPress={() => { setMode('signup'); setError(''); }}>
                    <Text style={styles.switchModeText}>{t('signUpLink')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          ) : (
            /* Carpenter Signup Form */
            <View style={styles.form}>
              <Text style={styles.inputLabel}>{t('fullName')} *</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder={t('fullNamePlaceholder')}
                  value={name}
                  onChangeText={(text) => { setName(text); setError(''); }}
                />
              </View>

              <Text style={[styles.inputLabel, styles.inputGap]}>{t('enterMobile')} *</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.countryCode}>+91</Text>
                <TextInput
                  style={styles.input}
                  placeholder="98765 43210"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={signupPhone}
                  onChangeText={(text) => { setSignupPhone(text.replace(/[^0-9]/g, '')); setError(''); }}
                />
              </View>

              <Text style={[styles.inputLabel, styles.inputGap]}>Email (Optional)</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="example@mail.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={(text) => { setEmail(text); setError(''); }}
                />
              </View>

              <View style={styles.rowInputs}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.inputLabel, styles.inputGap]}>{t('cityLabel')} *</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder={t('enterCity')}
                      value={city}
                      onChangeText={(text) => { setCity(text); setError(''); }}
                    />
                  </View>
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[styles.inputLabel, styles.inputGap]}>{t('stateLabel')} *</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder={t('enterState')}
                      value={state}
                      onChangeText={(text) => { setState(text); setError(''); }}
                    />
                  </View>
                </View>
              </View>

              <Text style={[styles.inputLabel, styles.inputGap]}>{t('aadhaar')} *</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder={t('aadhaarPlaceholder')}
                  keyboardType="numeric"
                  maxLength={12}
                  value={aadhaarNumber}
                  onChangeText={(text) => { setAadhaarNumber(text.replace(/[^0-9]/g, '')); setError(''); }}
                />
              </View>

              <Text style={[styles.inputLabel, styles.inputGap]}>{t('panCardLabel')}</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder={t('panCardPlaceholder')}
                  autoCapitalize="characters"
                  maxLength={10}
                  value={panCard}
                  onChangeText={(text) => { setPanCard(text.toUpperCase()); setError(''); }}
                />
              </View>

              <Text style={[styles.sectionHeading, styles.inputGap]}>{t('bankUpiDetails')}</Text>

              <Text style={styles.inputLabel}>{t('upiId')}</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder={t('upiPlaceholder')}
                  autoCapitalize="none"
                  value={upiId}
                  onChangeText={setUpiId}
                />
              </View>

              <Text style={[styles.inputLabel, styles.inputGap]}>{t('bankName')}</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder={t('bankNamePlaceholder')}
                  value={bankName}
                  onChangeText={setBankName}
                />
              </View>

              <Text style={[styles.inputLabel, styles.inputGap]}>{t('accountNumber')}</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder={t('accountPlaceholder')}
                  keyboardType="numeric"
                  value={accountNumber}
                  onChangeText={(text) => setAccountNumber(text.replace(/[^0-9]/g, ''))}
                />
              </View>

              <Text style={[styles.inputLabel, styles.inputGap]}>{t('ifscCode')}</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder={t('ifscPlaceholder')}
                  autoCapitalize="characters"
                  value={ifscCode}
                  onChangeText={setIfscCode}
                />
              </View>

              {/* Submit Action */}
              {(error || authError) ? <Text style={styles.errorText}>{error || authError}</Text> : null}

              <TouchableOpacity 
                style={[styles.button, (loading || busy) && styles.buttonDisabled]} 
                onPress={handleSignupSubmit}
                disabled={loading || busy}
              >
                {loading || busy ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.buttonText}>{t('registerBtn')}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.switchModeLink} onPress={() => { setMode('login'); setError(''); }}>
                <Text style={styles.switchModeText}>{t('loginLink')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Text style={styles.footerText}>{t('securePayouts')}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F6F4',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  languageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  languageChip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  languageChipActive: {
    backgroundColor: '#1E4620',
    borderColor: '#1E4620',
  },
  languageChipText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
  },
  languageChipTextActive: {
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#1E4620',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    alignItems: 'center',
    width: '100%',
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E4620',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '600',
  },
  roleRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  roleChip: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
  },
  roleChipActive: {
    backgroundColor: '#1E4620',
  },
  roleChipText: {
    color: '#475569',
    fontWeight: '800',
    fontSize: 13,
  },
  roleChipTextActive: {
    color: '#FFFFFF',
  },
  form: {
    width: '100%',
    marginTop: 24,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E4620',
    borderBottomWidth: 1.5,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 6,
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 4,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E4620',
    marginRight: 10,
    borderRightWidth: 1.5,
    borderRightColor: '#CBD5E1',
    paddingRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '500',
  },
  inputGap: {
    marginTop: 14,
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 10,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#1E4620',
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    shadowColor: '#1E4620',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  switchModeLink: {
    marginTop: 20,
    alignItems: 'center',
    padding: 8,
  },
  switchModeText: {
    color: '#D97706',
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  footerText: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 24,
    fontWeight: '500',
  },
});
