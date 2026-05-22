import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../config/api';
import { hasFullAccessFromProfile } from '../utils/access';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('user');
  const [planStatus, setPlanStatus] = useState('inactive');
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState(null);
  const [tiktokShopConnected, setTiktokShopConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const applyProfile = useCallback((data) => {
    if (!data) {
      setUser(null);
      setRole('user');
      setPlanStatus('inactive');
      setCurrentPeriodEnd(null);
      setTiktokShopConnected(false);
      return;
    }
    setUser(data);
    setRole(data.role || 'user');
    setPlanStatus(data.planStatus || 'inactive');
    setCurrentPeriodEnd(data.currentPeriodEnd || null);
    setTiktokShopConnected(Boolean(data.tiktokShopConnected));
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!api.token) {
      setLoading(false);
      return;
    }
    try {
      const data = await api.getMe();
      applyProfile(data);
    } catch {
      api.logout();
      applyProfile(null);
    } finally {
      setLoading(false);
    }
  }, [applyProfile]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('billing') === 'success' || params.get('tiktok') === 'connected') {
      refreshProfile();
    }
  }, [refreshProfile]);

  const isStaff = role === 'admin' || role === 'creator';

  const isPlanActive = useMemo(
    () => hasFullAccessFromProfile({ role, planStatus, currentPeriodEnd }),
    [role, planStatus, currentPeriodEnd]
  );

  const login = useCallback(
    async (email, password) => {
      const data = await api.login({ email, password });
      applyProfile({ ...data.user, role: data.role, planStatus: data.planStatus, currentPeriodEnd: data.currentPeriodEnd, tiktokShopConnected: data.tiktokShopConnected });
      return data;
    },
    [applyProfile]
  );

  const register = useCallback(
    async (payload) => {
      const data = await api.register(payload);
      applyProfile({ ...data.user, role: data.role, planStatus: data.planStatus, currentPeriodEnd: data.currentPeriodEnd, tiktokShopConnected: data.tiktokShopConnected });
      return data;
    },
    [applyProfile]
  );

  const logout = useCallback(() => {
    api.logout();
    applyProfile(null);
  }, [applyProfile]);

  const startCheckout = useCallback(async () => {
    if (!api.token) throw new Error('login_required');
    const { url } = await api.createCheckoutSession();
    if (url) window.location.href = url;
  }, []);

  const connectTikTok = useCallback(async () => {
    if (!api.token) throw new Error('login_required');
    const { authUrl } = await api.getConnectUrl();
    if (authUrl) window.location.href = authUrl;
  }, []);

  const value = useMemo(
    () => ({
      user,
      role,
      isStaff,
      loading,
      planStatus,
      currentPeriodEnd,
      tiktokShopConnected,
      isPlanActive,
      isAuthenticated: Boolean(user && api.token),
      refreshProfile,
      login,
      register,
      logout,
      startCheckout,
      connectTikTok,
    }),
    [
      user,
      role,
      isStaff,
      loading,
      planStatus,
      currentPeriodEnd,
      tiktokShopConnected,
      isPlanActive,
      refreshProfile,
      login,
      register,
      logout,
      startCheckout,
      connectTikTok,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
