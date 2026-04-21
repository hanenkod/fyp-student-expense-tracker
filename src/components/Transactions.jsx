import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { AddTransactionForm } from "./AddTransactionForm";
import { AddScheduledPaymentForm } from "./AddScheduledPaymentForm";
import { SavingsGoals } from "./SavingsGoals";
import { TransactionList } from "./TransactionList";
import { getStoredJSON, STORAGE_KEYS } from "../utils/storage";
import "../styles/style.css";
import "../styles/transactions.css";

export const Transactions = () => {
  // Single source of truth for all tx-related state, distributed to children via props.
  // Each child writes its slice back to LocalStorage via utils/storage helpers.
  const [transactions, setTransactions] = useState(
    () => getStoredJSON(STORAGE_KEYS.TRANSACTIONS, [])
  );
  const [scheduled, setScheduled] = useState(
    () => getStoredJSON(STORAGE_KEYS.SCHEDULED, [])
  );
  const [goals, setGoals] = useState(
    () => getStoredJSON(STORAGE_KEYS.GOALS, [])
  );
  const [customExpCat, setCustomExpCat] = useState(
    () => getStoredJSON(STORAGE_KEYS.EXPENSE_CATS, [])
  );
  const [customIncCat, setCustomIncCat] = useState(
    () => getStoredJSON(STORAGE_KEYS.INCOME_CATS, [])
  );

  const handleCategoriesChange = (kind, updated) => {
    if (kind === "expense") setCustomExpCat(updated);
    else setCustomIncCat(updated);
  };

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
                  transactions={transactions}
                  onTransactionsChange={setTransactions}
                  customExpCat={customExpCat}
                  customIncCat={customIncCat}
                  onCategoriesChange={handleCategoriesChange}
                />

                <AddScheduledPaymentForm
                  scheduled={scheduled}
                  onScheduledChange={setScheduled}
                />

                <SavingsGoals
                  goals={goals}
                  onGoalsChange={setGoals}
                  transactions={transactions}
                  onTransactionsChange={setTransactions}
                />
              </div>

              <div className="tx-right">
                <TransactionList
                  transactions={transactions}
                  onTransactionsChange={setTransactions}
                  scheduled={scheduled}
                  onScheduledChange={setScheduled}
                  customExpCat={customExpCat}
                  customIncCat={customIncCat}
                />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};