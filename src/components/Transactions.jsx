import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { AddTransactionForm } from "./AddTransactionForm";
import { AddScheduledPaymentForm } from "./AddScheduledPaymentForm";
import { SavingsGoals } from "./SavingsGoals";
import { TransactionList } from "./TransactionList";
import { useAuth } from "./AuthContext";
import { useData } from "./DataContext";
import { api } from "../utils/api";
import "../styles/style.css";
import "../styles/transactions.css";

export const Transactions = () => {
  const { user, setUser } = useAuth();
  const { loading } = useData();

  // Custom categories live on the user record (settingsJson would also work,
  // but we kept dedicated columns to keep things simple).
  const customExpCat = user?.customExpenseCategories
    ? JSON.parse(user.customExpenseCategories)
    : [];
  const customIncCat = user?.customIncomeCategories
    ? JSON.parse(user.customIncomeCategories)
    : [];

  // Local copies that we sync to the API on change.
  const [expCats, setExpCats] = useState(customExpCat);
  const [incCats, setIncCats] = useState(customIncCat);

  const handleCategoriesChange = async (kind, updated) => {
    if (kind === "expense") {
      setExpCats(updated);
      const u = await api.updateMe({ customExpenseCategories: JSON.stringify(updated) });
      setUser(u);
    } else {
      setIncCats(updated);
      const u = await api.updateMe({ customIncomeCategories: JSON.stringify(updated) });
      setUser(u);
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="app-shell">
          <div className="layout">
            <Sidebar />
            <main className="content" style={{ display: "grid", placeItems: "center", minHeight: "60vh", color: "#9391a0" }}>
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
                  <p className="overview-subtitle">Manage your transactions, subscriptions and savings</p>
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
