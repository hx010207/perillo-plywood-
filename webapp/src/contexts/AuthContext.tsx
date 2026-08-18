import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { User, Role, UserStatus } from '../types';
import {
  loginCarpenter as apiLoginCarpenter,
  loginAdmin as apiLoginAdmin,
  signupCarpenter as apiSignupCarpenter,
  fetchProfile,
} from '../services/api';

function buildUserFromCarpenter(data: any): User {
  const carpenter = data?.user || data?.carpenter || data || {};
  return {
    id: String(carpenter.id ?? carpenter.carpenter_id ?? carpenter.phone ?? 'user'),
    name: carpenter.name || carpenter.carpenter_name || 'User',
    phone: carpenter.phone || carpenter.mobile || '',
    role: 'carpenter',
    status: (carpenter.status || 'pending_approval') as UserStatus,
    aadhaar_number: carpenter.aadhaar_number || '',
    pan_card: carpenter.pan_card || '',
    city: carpenter.city || '',
    state: carpenter.state || '',
    preferred_language: carpenter.preferred_language || 'en',
    upi_id: carpenter.upi_id || '',
    bank_name: carpenter.bank_name || '',
    account_number: carpenter.account_number || '',
    ifsc_code: carpenter.ifsc_code || '',
    tier: carpenter.tier || 'Member',
    total_sheets: Number(carpenter.total_sheets || 0),
    points_balance: Number(carpenter.points_balance || 0),
    verified: carpenter.verified === true || carpenter.verified === 'true',
    linked_dealer: carpenter.linked_dealer || '',
    raw: carpenter,
  };
}

function buildUserFromAdmin(data: any, identifier: string): User {
  const admin = data?.user || data?.admin || data || {};
  return {
    id: String(admin.id ?? admin.admin_id ?? identifier ?? 'admin'),
    name: admin.name || admin.full_name || admin.username || 'Admin',
    email: admin.email || identifier || '',
    role: 'admin',
    raw: admin,
  };
}

interface AuthContextType {
  user: User | null;
  busy: boolean;
  error: string;
  loginCarpenter: (phone: string) => Promise<User>;
  loginAdmin: (identifier: string, password: string) => Promise<User>;
  signup: (signupData: Record<string, any>) => Promise<User>;
  logout: () => void;
  updateUser: (updatedFields: Partial<User>) => void;
  refreshProfile: () => Promise<User | undefined>;
  isAuthenticated: boolean;
  role: Role | null;
  status: UserStatus | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('perillo_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (user) {
      localStorage.setItem('perillo_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('perillo_user');
    }
  }, [user]);

  const loginCarpenter = async (phone: string): Promise<User> => {
    setBusy(true);
    setError('');
    try {
      const data = await apiLoginCarpenter(phone);
      const nextUser = buildUserFromCarpenter(data);
      setUser(nextUser);
      return nextUser;
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Login failed';
      setError(msg);
      throw new Error(msg);
    } finally {
      setBusy(false);
    }
  };

  const loginAdmin = async (identifier: string, password: string): Promise<User> => {
    setBusy(true);
    setError('');
    try {
      const data = await apiLoginAdmin(identifier, password);
      const nextUser = buildUserFromAdmin(data, identifier);
      setUser(nextUser);
      return nextUser;
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Admin login failed';
      setError(msg);
      throw new Error(msg);
    } finally {
      setBusy(false);
    }
  };

  const signup = async (signupData: Record<string, any>): Promise<User> => {
    setBusy(true);
    setError('');
    try {
      const data = await apiSignupCarpenter(signupData);
      const nextUser = buildUserFromCarpenter(data);
      setUser(nextUser);
      return nextUser;
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Signup failed';
      setError(msg);
      throw new Error(msg);
    } finally {
      setBusy(false);
    }
  };

  const refreshProfile = async (): Promise<User | undefined> => {
    if (!user || user.role !== 'carpenter') return undefined;
    try {
      const data = await fetchProfile(user.id);
      const nextUser = buildUserFromCarpenter(data);
      setUser(nextUser);
      return nextUser;
    } catch (err) {
      console.warn('Error refreshing profile:', err);
      return undefined;
    }
  };

  const logout = () => {
    setUser(null);
    setError('');
    localStorage.removeItem('perillo_user');
  };

  const updateUser = (updatedFields: Partial<User>) => {
    setUser((current) => (current ? { ...current, ...updatedFields } : null));
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
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
