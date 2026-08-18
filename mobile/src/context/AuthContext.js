import React, { createContext, useContext, useMemo, useState } from 'react';
import { loginAdmin as apiLoginAdmin, loginCarpenter as apiLoginCarpenter, signupCarpenter as apiSignupCarpenter } from '../services/api';

const AuthContext = createContext(null);

function normalizeLoginError(error, fallbackMessage) {
  const message = error?.message || '';
  if (error?.name === 'AbortError' || /network request failed|failed to fetch/i.test(message)) {
    return new Error('Network connection error. Check if backend is running.');
  }
  return new Error(message || fallbackMessage);
}

function buildUserFromCarpenter(data) {
  const carpenter = data?.carpenter || data?.user || data || {};
  return {
    id: carpenter.id ?? carpenter.carpenter_id ?? carpenter.phone ?? 'user',
    name: carpenter.name || carpenter.carpenter_name || 'User',
    phone: carpenter.phone || carpenter.mobile || '',
    role: 'carpenter',
    status: carpenter.status || 'pending_approval',
    // KYC fields exposed at top level for easy access
    aadhaar_number: carpenter.aadhaar_number || '',
    pan_card: carpenter.pan_card || '',
    city: carpenter.city || '',
    state: carpenter.state || '',
    preferred_language: carpenter.preferred_language || '',
    // Payment fields
    upi_id: carpenter.upi_id || '',
    bank_name: carpenter.bank_name || '',
    account_number: carpenter.account_number || '',
    ifsc_code: carpenter.ifsc_code || '',
    // Loyalty
    tier: carpenter.tier || 'Member',
    total_sheets: carpenter.total_sheets || 0,
    points_balance: carpenter.points_balance || 0,
    verified: carpenter.verified || false,
    linked_dealer: carpenter.linked_dealer || '',
    raw: carpenter,
  };
}

function buildUserFromAdmin(data, identifier) {
  const admin = data?.admin || data?.user || data || {};
  return {
    id: admin.id ?? admin.admin_id ?? identifier ?? 'admin',
    name: admin.name || admin.full_name || admin.username || 'Admin',
    email: admin.email || identifier || '',
    role: 'admin',
    raw: admin,
  };
}

export function AuthProvider({ baseUrl, children }) {
  const [user, setUser] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const loginCarpenter = async (phone) => {
    setBusy(true);
    setError('');
    try {
      const { response, data } = await apiLoginCarpenter(baseUrl, phone);
      if (!response.ok) {
        throw new Error(data?.message || 'Login failed');
      }
      const nextUser = buildUserFromCarpenter(data);
      setUser(nextUser);
      return nextUser;
    } catch (caughtError) {
      const normalizedError = normalizeLoginError(caughtError, 'Login failed');
      setError(normalizedError.message);
      throw normalizedError;
    } finally {
      setBusy(false);
    }
  };

  const loginAdmin = async (identifier, password) => {
    setBusy(true);
    setError('');
    try {
      const { response, data } = await apiLoginAdmin(baseUrl, identifier, password);
      if (!response.ok) {
        throw new Error(data?.message || 'Admin login failed');
      }
      const nextUser = buildUserFromAdmin(data, identifier);
      setUser(nextUser);
      return nextUser;
    } catch (caughtError) {
      const normalizedError = normalizeLoginError(caughtError, 'Admin login failed');
      setError(normalizedError.message);
      throw normalizedError;
    } finally {
      setBusy(false);
    }
  };

  const signup = async (signupData) => {
    setBusy(true);
    setError('');
    try {
      const { response, data } = await apiSignupCarpenter(baseUrl, signupData);
      if (!response.ok) {
        throw new Error(data?.error || data?.message || 'Signup failed');
      }
      const nextUser = buildUserFromCarpenter(data);
      setUser(nextUser);
      return nextUser;
    } catch (caughtError) {
      const normalizedError = normalizeLoginError(caughtError, 'Signup failed');
      setError(normalizedError.message);
      throw normalizedError;
    } finally {
      setBusy(false);
    }
  };

  const refreshProfile = async () => {
    if (!user || user.role !== 'carpenter') return;
    try {
      const res = await fetch(`${baseUrl}/profile/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        const nextUser = buildUserFromCarpenter(data);
        setUser(nextUser);
        return nextUser;
      }
    } catch (caughtError) {
      console.warn('Error refreshing profile:', caughtError);
    }
  };

  const logout = () => {
    setUser(null);
    setError('');
  };

  const updateUser = (nextUser) => {
    setUser((currentUser) => {
      if (!currentUser) {
        return nextUser;
      }
      return { ...currentUser, ...nextUser };
    });
  };

  const value = useMemo(
    () => ({
      user,
      busy,
      error,
      loginCarpenter,
      loginAdmin,
      signup,
      logout,
      updateUser,
      refreshProfile,
      isAuthenticated: Boolean(user),
      role: user?.role || null,
      status: user?.status || null,
    }),
    [user, busy, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
