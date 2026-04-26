import { useState } from "react";
import { useSettings } from "./SettingsContext";
import { useToast } from "./ToastContext";
import { useData } from "./DataContext";

const EXPENSE_CATEGORIES = ["Food","Transport","Entertainment","Bills","Shopping","Education","Health","Subscriptions","Other"];
const INCOME_CATEGORIES = ["Salary","Freelance","Gift","Scholarship","Refund","Investment","Other"];

export const AddTransactionForm = ({ customExpCat = [], customIncCat = [], onCategoriesChange }) => {
  const { currencyInfo, formatMoney } = useSettings();
  const { showToast } = useToast();
  const { addTransaction } = useData();

  const [txForm, setTxForm] = useState({
    type: "expense",
    name: "",
    amount: "",
    category: "Food",
    date: new Date().toISOString().slice(0, 16),
  });
  const [newCategory, setNewCategory] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const allExpCat = [...EXPENSE_CATEGORIES, ...customExpCat];
  const allIncCat = [...INCOME_CATEGORIES, ...customIncCat];
  const currentCategories = txForm.type === "expense" ? allExpCat : allIncCat;

  const handleTypeSwitch = (type) => {
    setTxForm((p) => ({ ...p, type, category: type === "expense" ? "Food" : "Salary" }));
    setShowNewCategory(false);
    setNewCategory("");
  };

  const handleAddCategory = () => {
    const name = newCategory.trim();
    if (!name) {
      showToast("Category name can't be empty", { type: "error" });
      return;
    }
    const isExpense = txForm.type === "expense";
    const current = isExpense ? customExpCat : customIncCat;
    const builtins = isExpense ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

    if (current.includes(name) || builtins.includes(name)) {
      showToast(`Category "${name}" already exists`, { type: "warning" });
      setShowNewCategory(false);
      setNewCategory("");
      return;
    }
    const updated = [...current, name];
    onCategoriesChange(isExpense ? "expense" : "income", updated);
    setTxForm((p) => ({ ...p, category: name }));
    setShowNewCategory(false);
    setNewCategory("");
    showToast(`Added category "${name}"`, { type: "success" });
  };

  const handleAddTransaction = async () => {
    if (!txForm.name.trim()) {
      showToast("Please enter a transaction name", { type: "error" });
      return;
    }
    if (!txForm.amount || Number(txForm.amount) <= 0) {
      showToast("Amount must be greater than zero", { type: "error" });
      return;
    }

    setSubmitting(true);
    try {
      const created = await addTransaction({
        type: txForm.type,
        name: txForm.name.trim(),
        category: txForm.category,
        amount: Number(txForm.amount),
        date: new Date(txForm.date).toISOString(),
      });
      setTxForm({
        type: txForm.type,
        name: "",
        amount: "",
        category: txForm.type === "expense" ? "Food" : "Salary",
        date: new Date().toISOString().slice(0, 16),
      });
      showToast(
        `${txForm.type === "expense" ? "Expense" : "Income"} added: ${formatMoney(Number(created.amount))}`,
        { type: "success" }
      );
    } catch (err) {
      showToast(err?.body?.error || "Could not add transaction", { type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="tx-card card-soft">
      <h3 className="tx-card__title">Add Transaction</h3>
      <div className="tx-type-toggle">
        <button
          className={`tx-type-btn ${txForm.type === "expense" ? "tx-type-btn--active tx-type-btn--expense" : ""}`}
          onClick={() => handleTypeSwitch("expense")}
          aria-pressed={txForm.type === "expense"}
        >Expense</button>
        <button
          className={`tx-type-btn ${txForm.type === "income" ? "tx-type-btn--active tx-type-btn--income" : ""}`}
          onClick={() => handleTypeSwitch("income")}
          aria-pressed={txForm.type === "income"}
        >Income</button>
      </div>
      <div className="tx-form">
        <input
          type="text"
          placeholder="Transaction name"
          value={txForm.name}
          onChange={(e) => setTxForm((p) => ({ ...p, name: e.target.value }))}
          className="tx-input"
          aria-label="Transaction name"
        />

        <div className="tx-amount-wrap">
          <span className="tx-amount-symbol" aria-hidden="true">{currencyInfo.symbol}</span>
          <input
            type="number"
            placeholder="0.00"
            value={txForm.amount}
            onChange={(e) => setTxForm((p) => ({ ...p, amount: e.target.value }))}
            className="tx-input tx-input--with-prefix"
            min="0"
            step="0.01"
            aria-label="Amount"
          />
        </div>

        <div className="tx-category-row">
          {!showNewCategory && (
            <select
              value={txForm.category}
              onChange={(e) => setTxForm((p) => ({ ...p, category: e.target.value }))}
              className="tx-select"
              aria-label="Category"
            >
              {currentCategories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          {showNewCategory && (
            <>
              <input
                type="text"
                placeholder="New category name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="tx-input"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddCategory();
                  if (e.key === "Escape") { setShowNewCategory(false); setNewCategory(""); }
                }}
                autoFocus
                aria-label="New category name"
              />
              <button type="button" className="tx-submit tx-submit--sm" onClick={handleAddCategory}>Add</button>
            </>
          )}
          <button
            type="button"
            className={`tx-toggle-btn ${showNewCategory ? "tx-toggle-btn--open" : ""}`}
            onClick={() => setShowNewCategory(!showNewCategory)}
            aria-label={showNewCategory ? "Cancel new category" : "Add new category"}
            aria-expanded={showNewCategory}
          >
            <span className="tx-toggle-btn__icon">+</span>
          </button>
        </div>

        <input
          type="datetime-local"
          value={txForm.date}
          onChange={(e) => setTxForm((p) => ({ ...p, date: e.target.value }))}
          className="tx-input"
          aria-label="Date and time"
        />
        <button
          type="button"
          className="tx-submit"
          onClick={handleAddTransaction}
          disabled={submitting}
        >
          {submitting ? "Adding…" : "Add Transaction"}
        </button>
      </div>
    </div>
  );
};
