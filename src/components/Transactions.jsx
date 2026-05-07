/**
 * Transactions page — composes the four feature panels (add tx, add
 * subscription, savings goals, transaction list) and owns the local
 * state for the user's custom categories.
 *
 * The custom category lists are stored as JSON-encoded strings on the
 * server (User.customExpenseCategories / customIncomeCategories). This
 * component decodes them defensively, syncs local state with the user
 * record whenever it changes, and pushes updates back via the API.
 */
import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { AddTransactionForm } from "./AddTransactionForm";
import { AddScheduledPaymentForm } from "./AddScheduledPaymentForm";
import { SavingsGoals } from "./SavingsGoals";
import { TransactionList } from "./TransactionList";
import { TopCategoriesCard } from "./TopCategoriesCard";
import { useAuth } from "./AuthContext";
import { useData } from "./DataContext";
import { api } from "../utils/api";
import "../styles/style.css";
import "../styles/transactions.css";

/**
 * Decode a JSON-encoded array string from the server, returning [] for
 * null, undefined, or malformed input. Without this guard a corrupt row
 * would crash the entire page.
 */
const parseCategoryList = (raw) => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const Transactions = () => {
  const { user, setUser } = useAuth();
  const { loading, transactions } = useData();

  // Filter to this month and compute total expenses for the
  // TopCategoriesCard at the top of the left column. Done here rather
  // than inside the card so the same month boundary is used by any
  // other consumer that lands on this page in the future.
  const now = new Date();
  const thisMonthTx = transactions.filter((t) => {
    const d = new Date(t.date);
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  });
  const totalMonthlyExpenses = thisMonthTx
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount || 0), 0);

  // Local copies of the user's custom categories. Initialised from the
  // user record and resynced via useEffect when the user changes.
  const [expCats, setExpCats] = useState([]);
  const [incCats, setIncCats] = useState([]);

  useEffect(() => {
    setExpCats(parseCategoryList(user?.customExpenseCategories));
    setIncCats(parseCategoryList(user?.customIncomeCategories));
  }, [user?.customExpenseCategories, user?.customIncomeCategories]);

  /**
   * Persist a category list change to the server and update local state.
   * Called by AddTransactionForm whenever the user adds a new category.
   */
  const handleCategoriesChange = async (kind, updated) => {
    if (kind === "expense") {
      setExpCats(updated);
      const u = await api.updateMe({
        customExpenseCategories: JSON.stringify(updated),
      });
      setUser(u);
    } else {
      setIncCats(updated);
      const u = await api.updateMe({
        customIncomeCategories: JSON.stringify(updated),
      });
      setUser(u);
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="app-shell">
          <div className="layout">
            <Sidebar />
            <main
              className="content"
              style={{
                display: "grid",
                placeItems: "center",
                minHeight: "60vh",
                color: "#9391a0",
              }}
            >
              Loading…
            </main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="app-shell">
        <div className="layout">
          <Sidebar />
          <main className="content">
            <header className="overview card card-soft card-overview">
              <div className="overview-bar">
                <div className="overview-text stack-5">
                  <h1 className="overview-title">Transactions</h1>
                  <p className="overview-subtitle">
                    Manage your transactions, subscriptions and savings
                  </p>
                </div>
              </div>
            </header>

            <div className="tx-layout">
              <div className="tx-left">
                <TopCategoriesCard
                  thisMonthTx={thisMonthTx}
                  totalExpenses={totalMonthlyExpenses}
                />
                <AddTransactionForm
                  customExpCat={expCats}
                  customIncCat={incCats}
                  onCategoriesChange={handleCategoriesChange}
                />
                <AddScheduledPaymentForm />
                <SavingsGoals />
              </div>

              <div className="tx-right">
                <TransactionList
                  customExpCat={expCats}
                  customIncCat={incCats}
                />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};