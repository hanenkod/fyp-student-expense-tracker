import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, getToken, clearToken, setToken } from "../utils/api";
import { migrateLocalStorageIfNeeded } from "../utils/migration";

const AuthContext = createContext(null);

/**
 * Provides the current authenticated user (or null) and the auth actions.
 *
 *   const { user, loading, login, register, logout, refresh } = useAuth();
 *
 * On mount, if a JWT exists in LocalStorage, the provider tries to fetch
 * the current user. If the token is invalid/expired the user is cleared
 * and the consumer can redirect to /login.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api.getMe();
      setUser(me);
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = async (email, password) => {
    const { token, user: u } = await api.login(email, password);
    setToken(token);
    await migrateLocalStorageIfNeeded(u.id);
    const me = await api.getMe();
    setUser(me);
    return me;
  };

  const register = async (email, password, name) => {
    const { token, user: u } = await api.register(email, password, name);
    setToken(token);
    await migrateLocalStorageIfNeeded(u.id);
    const me = await api.getMe();
    setUser(me);
    return me;
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
};
