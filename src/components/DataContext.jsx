/**
 * DataContext — single source of truth for the user's domain data.
 *
 * Loads transactions, scheduled payments, and goals from the API once
 * the user is authenticated, then exposes mutator helpers that write
 * to the API and update the local cache optimistically.
 *
 * Usage:
 *   const {
 *     transactions, scheduled, goals, loading, error,
 *     addTransaction, removeTransaction, addToGoal, ...
 *   } = useData();
 *
 * Why centralise: every page (Dashboard, Transactions, Profile, etc.)
 * needs the same data. Without this context each page would refetch on
 * mount, causing duplicate work and inconsistent UI.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "../utils/api";
import { useAuth } from "./AuthContext";

const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
  const { user } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [scheduled, setScheduled] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Reload all three collections from the server. Called automatically
   * whenever the authenticated user changes (login, logout, or full
   * re-fetch via AuthContext.refresh).
   */
  const refreshAll = useCallback(async () => {
    if (!user) {
      setTransactions([]);
      setScheduled([]);
      setGoals([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [txs, sps, gs] = await Promise.all([
        api.listTransactions(),
        api.listScheduled(),
        api.listGoals(),
      ]);
      setTransactions(txs);
      setScheduled(sps);
      setGoals(gs);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Transaction mutators. Each one calls the API, then patches the
  // local cache so the UI updates without a full refetch.
  const addTransaction = async (data) => {
    const created = await api.createTransaction(data);
    setTransactions((prev) => [created, ...prev]);
    return created;
  };

  const updateTransaction = async (id, patch) => {
    const updated = await api.updateTransaction(id, patch);
    setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t)));
    return updated;
  };

  const removeTransaction = async (id) => {
    await api.deleteTransaction(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // Scheduled payment mutators.
  const addScheduled = async (data) => {
    const created = await api.createScheduled(data);
    setScheduled((prev) => [created, ...prev]);
    return created;
  };

  const removeScheduled = async (id) => {
    await api.deleteScheduled(id);
    setScheduled((prev) => prev.filter((s) => s.id !== id));
  };

  // Goal mutators.
  const addGoal = async (data) => {
    const created = await api.createGoal(data);
    setGoals((prev) => [created, ...prev]);
    return created;
  };

  const updateGoal = async (id, patch) => {
    const updated = await api.updateGoal(id, patch);
    setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
    return updated;
  };

  const removeGoal = async (id) => {
    await api.deleteGoal(id);
    setGoals((prev) => prev.filter((g) => g.id !== id));
    // Backend may have created a refund tx on delete — reload the
    // transaction list to surface it.
    refreshAll();
  };

  const addToGoal = async (id, amount) => {
    const result = await api.addToGoal(id, amount);
    setGoals((prev) => prev.map((g) => (g.id === id ? result.goal : g)));
    setTransactions((prev) => [result.transaction, ...prev]);
    return result;
  };

  const withdrawFromGoal = async (id, amount) => {
    const result = await api.withdrawFromGoal(id, amount);
    setGoals((prev) => prev.map((g) => (g.id === id ? result.goal : g)));
    setTransactions((prev) => [result.transaction, ...prev]);
    return result;
  };

  // Memoise the value object so consumers don't re-render every time
  // the provider re-renders for an unrelated reason.
  const value = useMemo(
    () => ({
      transactions,
      scheduled,
      goals,
      loading,
      error,
      refreshAll,
      addTransaction,
      updateTransaction,
      removeTransaction,
      addScheduled,
      removeScheduled,
      addGoal,
      updateGoal,
      removeGoal,
      addToGoal,
      withdrawFromGoal,
    }),
    [transactions, scheduled, goals, loading, error, refreshAll]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within <DataProvider>");
  return ctx;
};
