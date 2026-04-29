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
import { useAuth } from "./AuthContext";
import { useData } from "./DataContext";
import { LoadingScreen } from "./LoadingScreen";
import { api } from "../utils/api";
import { safeArray } from "../utils/json";
import "../styles/style.css";
import "../styles/transactions.css";

export const Transactions = () => {
  const { user, setUser } = useAuth();
  const { loading } = useData();

  // Local copies of the user's custom categories. Initialised from the
  // user record and resynced via useEffect when the user changes.
  const [expCats, setExpCats] = useState([]);
  const [incCats, setIncCats] = useState([]);

  useEffect(() => {
    setExpCats(safeArray(user?.customExpenseCategories));
    setIncCats(safeArray(user?.customIncomeCategories));
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
    return <LoadingScreen />;
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
