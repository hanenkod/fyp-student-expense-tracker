/**
 * AuthContext — central source of truth for the current authenticated user.
 *
 * Exposes the user record, a loading flag (true while the initial
 * `getMe()` call is in flight), and the four auth actions every page
 * might need: login, register, logout, and a refresh that re-fetches
 * the user from the server.
 *
 * Usage:
 *   const { user, loading, login, register, logout, refresh } = useAuth();
 *
 * On mount, if a JWT exists in LocalStorage, the provider tries to
 * fetch the user. A failure (expired token, deleted account, etc.)
 * silently clears the token so the consumer can redirect to /login.
 */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { api, getToken, clearToken, setToken } from "../utils/api";
import { migrateLocalStorageIfNeeded } from "../utils/migration";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Fetch the current user from the server. Clears the token on
   * failure so RouteGuards redirect cleanly.
   */
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

  useEffect(() => {
    refresh();
  }, [refresh]);

  /**
   * Sign in an existing user. Triggers the legacy LocalStorage
   * migration on first login per browser (the helper is a no-op on
   * every subsequent call thanks to its global flag).
   */
  const login = async (email, password) => {
    const { token } = await api.login(email, password);
    setToken(token);
    await migrateLocalStorageIfNeeded();
    const me = await api.getMe();
    setUser(me);
    return me;
  };

  /**
   * Register a new account. Deliberately does NOT run the legacy
   * migration — a brand-new account should always start clean,
   * otherwise it inherits whatever LocalStorage data was lying
   * around from a previous user of this browser.
   */
  const register = async (email, password, name) => {
    const { token } = await api.register(email, password, name);
    setToken(token);
    const me = await api.getMe();
    setUser(me);
    return me;
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refresh, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook for consuming the auth context. Throws if used outside the
 * provider so misuse is caught at development time.
 */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
};