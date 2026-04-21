import { useState, useMemo } from "react";
import { useSettings } from "./SettingsContext";
import { useToast } from "./ToastContext";
import { saveJSON, STORAGE_KEYS } from "../utils/storage";

const EXPENSE_CATEGORIES = [
  "Food", "Transport", "Entertainment", "Bills", "Shopping",
  "Education", "Health", "Subscriptions", "Other",
];
const INCOME_CATEGORIES = [
  "Salary", "Freelance", "Gift", "Scholarship", "Refund", "Investment", "Other",
];

const formatDate = (iso) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const formatTime = (iso) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

// Date range filter options
const DATE_RANGES = {
  all: { label: "All time", daysBack: null },
  today: { label: "Today", daysBack: 0 },
  week: { label: "Last 7 days", daysBack: 7 },
  month: { label: "This month", daysBack: -1 }, // special: current month
  last_month: { label: "Last month", daysBack: -2 }, // special: previous calendar month
};

export const TransactionList = ({
  transactions,
  onTransactionsChange,
  scheduled,
  onScheduledChange,
  customExpCat,
  customIncCat,
}) => {
  const { formatMoney, currencyInfo } = useSettings();
  const { showToast } = useToast();

  const [editingTx, setEditingTx] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("transactions");
  const [typeFilter, setTypeFilter] = useState("all");   // all | expense | income
  const [dateFilter, setDateFilter] = useState("all");   // key of DATE_RANGES

  const persistTx = (u) => { onTransactionsChange(u); saveJSON(STORAGE_KEYS.TRANSACTIONS, u); };
  const persistSp = (u) => { onScheduledChange(u); saveJSON(STORAGE_KEYS.SCHEDULED, u); };

  const allExpCat = [...EXPENSE_CATEGORIES, ...customExpCat];
  const allIncCat = [...INCOME_CATEGORIES, ...customIncCat];

  // Apply filters in the order: type -> date -> search
  const visibleTx = useMemo(() => {
    let list = [...transactions];

    if (typeFilter !== "all") list = list.filter((t) => t.type === typeFilter);

    if (dateFilter !== "all") {
      const now = new Date();
      const range = DATE_RANGES[dateFilter];
      list = list.filter((t) => {
        const d = new Date(t.date);
        if (range.daysBack === -1) {
          // current month
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }
        if (range.daysBack === -2) {
          // previous calendar month
          const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          return d.getMonth() === prev.getMonth() && d.getFullYear() === prev.getFullYear();
        }
        if (range.daysBack === 0) {
          return d.toDateString() === now.toDateString();
        }
        const threshold = new Date();
        threshold.setDate(threshold.getDate() - range.daysBack);
        return d >= threshold;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((t) =>
        t.name.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.amount.toString().includes(q)
      );
    }

    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, typeFilter, dateFilter, searchQuery]);

  const totalScheduled = scheduled.reduce((s, p) => s + p.amount, 0);
  const editCategories = editForm.type === "expense" ? allExpCat : allIncCat;

  // ── Handlers ──
  const handleDeleteTx = (id) => {
    const tx = transactions.find((t) => t.id === id);
    if (!tx) return;
    const snapshot = transactions;
    const updated = transactions.filter((t) => t.id !== id);
    persistTx(updated);

    showToast(`Deleted "${tx.name}"`, {
      type: "info",
      duration: 5000,
      action: {
        label: "Undo",
        onClick: () => {
          persistTx(snapshot);
          showToast(`Restored "${tx.name}"`, { type: "success" });
        },
      },
    });
  };

  const handleStartEdit = (tx) => {
    setEditingTx(tx.id);
    setEditForm({ name: tx.name, amount: String(tx.amount), category: tx.category, type: tx.type });
  };

  const handleSaveEdit = (id) => {
    if (!editForm.name.trim()) {
      showToast("Name cannot be empty", { type: "error" });
      return;
    }
    if (Number(editForm.amount) <= 0) {
      showToast("Amount must be greater than zero", { type: "error" });
      return;
    }
    persistTx(transactions.map((t) => t.id === id ? {
      ...t,
      name: editForm.name.trim(),
      amount: Number(editForm.amount),
      category: editForm.category,
      type: editForm.type,
    } : t));
    setEditingTx(null);
    showToast("Transaction updated", { type: "success" });
  };

  const handleDeleteScheduled = (id) => {
    const sp = scheduled.find((s) => s.id === id);
    if (!sp) return;
    const snapshot = scheduled;
    persistSp(scheduled.filter((s) => s.id !== id));

    showToast(`Removed "${sp.name}"`, {
      type: "info",
      duration: 5000,
      action: {
        label: "Undo",
        onClick: () => {
          persistSp(snapshot);
          showToast(`Restored "${sp.name}"`, { type: "success" });
        },
      },
    });
  };

  const activeFilterCount =
    (typeFilter !== "all" ? 1 : 0) +
    (dateFilter !== "all" ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  return (
    <>
      <div className="tx-tabs">
        <button
          className={`tx-tab ${activeTab === "transactions" ? "tx-tab--active" : ""}`}
          onClick={() => setActiveTab("transactions")}
          aria-pressed={activeTab === "transactions"}
        >
          Transactions ({transactions.length})
        </button>
        <button
          className={`tx-tab ${activeTab === "scheduled" ? "tx-tab--active" : ""}`}
          onClick={() => setActiveTab("scheduled")}
          aria-pressed={activeTab === "scheduled"}
        >
          Scheduled ({scheduled.length})
        </button>
      </div>

      {activeTab === "transactions" && (
        <div className="tx-card card-soft tx-list-card">
          <div className="tx-list-header">
            <h3 className="tx-card__title">All Transactions</h3>
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="tx-input tx-search-input"
              aria-label="Search"
            />
          </div>

          {/* Filters */}
          <div className="tx-filters">
            <div className="tx-filter-group" role="group" aria-label="Filter by type">
              <button
                className={`tx-filter-chip ${typeFilter === "all" ? "tx-filter-chip--active" : ""}`}
                onClick={() => setTypeFilter("all")}
              >All</button>
              <button
                className={`tx-filter-chip ${typeFilter === "expense" ? "tx-filter-chip--active tx-filter-chip--expense" : ""}`}
                onClick={() => setTypeFilter("expense")}
              >Expenses</button>
              <button
                className={`tx-filter-chip ${typeFilter === "income" ? "tx-filter-chip--active tx-filter-chip--income" : ""}`}
                onClick={() => setTypeFilter("income")}
              >Income</button>
            </div>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="tx-select tx-select--sm tx-filter-date"
              aria-label="Filter by date"
            >
              {Object.entries(DATE_RANGES).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            {activeFilterCount > 0 && (
              <button
                className="tx-filter-clear"
                onClick={() => {
                  setTypeFilter("all");
                  setDateFilter("all");
                  setSearchQuery("");
                }}
              >
                Clear {activeFilterCount > 1 ? `(${activeFilterCount})` : ""}
              </button>
            )}
          </div>

          {visibleTx.length === 0 ? (
            <p className="tx-empty">
              {transactions.length === 0
                ? "No transactions yet. Add one on the left to get started."
                : "No transactions match these filters."}
            </p>
          ) : (
            <div className="tx-list">
              {visibleTx.map((tx) => (
                <div key={tx.id} className="tx-row">
                  {editingTx === tx.id ? (
                    <div className="tx-row-edit">
                      <div className="tx-row-edit__fields">
                        <div className="tx-row-edit__field">
                          <label className="tx-field-label">Name</label>
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                            className="tx-input tx-input--sm"
                          />
                        </div>
                        <div className="tx-row-edit__field">
                          <label className="tx-field-label">Amount ({currencyInfo.symbol})</label>
                          <input
                            type="number"
                            value={editForm.amount}
                            onChange={(e) => setEditForm((p) => ({ ...p, amount: e.target.value }))}
                            className="tx-input tx-input--sm"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <div className="tx-row-edit__field">
                          <label className="tx-field-label">Category</label>
                          <select
                            value={editForm.category}
                            onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value }))}
                            className="tx-select tx-select--sm"
                          >
                            {editCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div className="tx-row-edit__field">
                          <label className="tx-field-label">Type</label>
                          <select
                            value={editForm.type}
                            onChange={(e) => setEditForm((p) => ({ ...p, type: e.target.value }))}
                            className="tx-select tx-select--sm"
                          >
                            <option value="expense">Expense</option>
                            <option value="income">Income</option>
                          </select>
                        </div>
                      </div>
                      <div className="tx-row-edit__actions">
                        <button className="tx-row-btn tx-row-btn--save" onClick={() => handleSaveEdit(tx.id)}>Save</button>
                        <button className="tx-row-btn tx-row-btn--cancel" onClick={() => setEditingTx(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className={`tx-row__dot tx-row__dot--${(tx.category || "other").toLowerCase().replace(/\s+/g, "-")}`} />
                      <div className="tx-row__info">
                        <span className="tx-row__name">{tx.name}</span>
                        <span className="tx-row__meta">{tx.category} · {formatDate(tx.date)} · {formatTime(tx.date)}</span>
                      </div>
                      <span className={`tx-row__amount tx-row__amount--${tx.type}`}>
                        {tx.type === "expense" ? "-" : "+"}{formatMoney(tx.amount, { minFractionDigits: 2, maxFractionDigits: 2 })}
                      </span>
                      <div className="tx-row__actions">
                        <button
                          className="tx-row-btn"
                          onClick={() => handleStartEdit(tx)}
                          aria-label={`Edit ${tx.name}`}
                        >
                          Edit
                        </button>
                        <button
                          className="tx-row-btn tx-row-btn--del"
                          onClick={() => handleDeleteTx(tx.id)}
                          aria-label={`Delete ${tx.name}`}
                        >
                          ×
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "scheduled" && (
        <div className="tx-card card-soft tx-list-card">
          <h3 className="tx-card__title">All Scheduled Payments</h3>
          {scheduled.length === 0 ? (
            <p className="tx-empty">No scheduled payments.</p>
          ) : (
            <>
              <div className="sp-total">Total monthly: <strong>{formatMoney(totalScheduled, { minFractionDigits: 2, maxFractionDigits: 2 })}</strong></div>
              <div className="tx-list">
                {scheduled.map((sp) => (
                  <div key={sp.id} className="tx-row">
                    <div className="tx-row__dot tx-row__dot--subscriptions" />
                    <div className="tx-row__info">
                      <span className="tx-row__name">{sp.name}</span>
                      <span className="tx-row__meta">
                        {sp.frequency}
                        {sp.startDate && ` · since ${formatDate(sp.startDate)}`}
                      </span>
                    </div>
                    <span className="tx-row__amount tx-row__amount--expense">
                      {formatMoney(sp.amount, { minFractionDigits: 2, maxFractionDigits: 2 })}
                    </span>
                    <div className="tx-row__actions">
                      <button
                        className="tx-row-btn tx-row-btn--del"
                        onClick={() => handleDeleteScheduled(sp.id)}
                        aria-label={`Remove ${sp.name}`}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};