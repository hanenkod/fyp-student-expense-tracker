import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { SavingsPanel } from "./SavingsPanel";
import "../styles/style.css";
import "../styles/transactions.css";

const getStoredJSON = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveToStorage = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const EXPENSE_CATEGORIES = ["Food","Transport","Entertainment","Bills","Shopping","Education","Health","Subscriptions","Other"];
const INCOME_CATEGORIES = ["Salary","Freelance","Gift","Scholarship","Refund","Investment","Other"];

const PRESET_SERVICES = [
  { name: "Spotify", amount: 10.99 },
  { name: "Netflix", amount: 15.99 },
  { name: "YouTube Premium", amount: 13.99 },
  { name: "Apple Music", amount: 10.99 },
  { name: "Amazon Prime", amount: 8.99 },
  { name: "Disney+", amount: 7.99 },
  { name: "Pure Gym", amount: 32.99 },
  { name: "iCloud+", amount: 2.99 },
];

const GOAL_ICONS = ["🛡️","✈️","🏠","💻","🎓","🚗","💰","🎁","📱","🎯"];
const GOAL_COLORS = ["#5dbb63","#4f518c","#907ad6","#e07c4a","#d65c8a","#3d9be9"];

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const formatTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
};

export const Transactions = () => {
  const [transactions, setTransactions] = useState(() => getStoredJSON("pockeTransactions") || []);
  const [scheduled, setScheduled] = useState(() => getStoredJSON("pockeScheduledPayments") || []);
  const [goals, setGoals] = useState(() => getStoredJSON("pockeGoals") || []);
  const [customExpCat, setCustomExpCat] = useState(() => getStoredJSON("pockeCustomExpenseCategories") || []);
  const [customIncCat, setCustomIncCat] = useState(() => getStoredJSON("pockeCustomIncomeCategories") || []);

  const allExpCat = [...EXPENSE_CATEGORIES, ...customExpCat];
  const allIncCat = [...INCOME_CATEGORIES, ...customIncCat];

  const [txForm, setTxForm] = useState({ type: "expense", name: "", amount: "", category: "Food", date: new Date().toISOString().slice(0, 16) });
  const [newCategory, setNewCategory] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [spForm, setSpForm] = useState({ preset: "", name: "", amount: "", frequency: "monthly", startDate: new Date().toISOString().split("T")[0] });
  const [showCustomService, setShowCustomService] = useState(false);
  const [goalForm, setGoalForm] = useState({ title: "", target: "", icon: "🎯" });
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("transactions");
  const [withdrawingGoalId, setWithdrawingGoalId] = useState(null);
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const currentCategories = txForm.type === "expense" ? allExpCat : allIncCat;

  const handleTypeSwitch = (type) => {
    setTxForm((p) => ({ ...p, type, category: type === "expense" ? "Food" : "Salary" }));
    setShowNewCategory(false);
    setNewCategory("");
  };

  const saveTx = (u) => { setTransactions(u); saveToStorage("pockeTransactions", u); };
  const saveSp = (u) => { setScheduled(u); saveToStorage("pockeScheduledPayments", u); };
  const saveGoals = (u) => { setGoals(u); saveToStorage("pockeGoals", u); };

  const handleAddTransaction = () => {
    if (!txForm.name.trim() || !txForm.amount || Number(txForm.amount) <= 0) return;
    saveTx([{ id: `tx_${Date.now()}`, type: txForm.type, name: txForm.name.trim(), amount: Number(txForm.amount), category: txForm.category, date: new Date(txForm.date).toISOString() }, ...transactions]);
    setTxForm((p) => ({ ...p, name: "", amount: "", date: new Date().toISOString().slice(0, 16) }));
  };

  const handleDeleteTx = (id) => saveTx(transactions.filter((t) => t.id !== id));

  const handleStartEdit = (tx) => {
    setEditingTx(tx.id);
    setEditForm({ name: tx.name, amount: tx.amount, category: tx.category, type: tx.type });
  };

  const handleSaveEdit = (id) => {
    if (!editForm.name.trim() || Number(editForm.amount) <= 0) return;
    saveTx(transactions.map((t) => t.id === id ? { ...t, name: editForm.name.trim(), amount: Number(editForm.amount), category: editForm.category, type: editForm.type } : t));
    setEditingTx(null);
  };

  const handleAddCategory = () => {
    const cat = newCategory.trim();
    if (!cat) return;
    if (txForm.type === "expense") {
      if (allExpCat.includes(cat)) return;
      const u = [...customExpCat, cat]; setCustomExpCat(u); saveToStorage("pockeCustomExpenseCategories", u);
    } else {
      if (allIncCat.includes(cat)) return;
      const u = [...customIncCat, cat]; setCustomIncCat(u); saveToStorage("pockeCustomIncomeCategories", u);
    }
    setTxForm((p) => ({ ...p, category: cat }));
    setNewCategory(""); setShowNewCategory(false);
  };

  const handlePresetSelect = (preset) => {
    if (preset === "__custom") { setShowCustomService(true); setSpForm((p) => ({ ...p, preset: "", name: "", amount: "" })); }
    else { const f = PRESET_SERVICES.find((s) => s.name === preset); setShowCustomService(false); setSpForm((p) => ({ ...p, preset, name: f?.name || "", amount: f?.amount?.toString() || "" })); }
  };

  const handleAddScheduled = () => {
    if (!spForm.name.trim() || !spForm.amount || Number(spForm.amount) <= 0) return;
    saveSp([...scheduled, { id: `sp_${Date.now()}`, name: spForm.name.trim(), amount: Number(spForm.amount), frequency: spForm.frequency, startDate: spForm.startDate }]);
    setSpForm({ preset: "", name: "", amount: "", frequency: "monthly", startDate: new Date().toISOString().split("T")[0] }); setShowCustomService(false);
  };

  const handleDeleteScheduled = (id) => saveSp(scheduled.filter((s) => s.id !== id));

  const handleAddGoal = () => {
    const target = parseFloat(goalForm.target);
    if (!goalForm.title.trim() || isNaN(target) || target <= 0) return;
    saveGoals([...goals, { id: `sg_${Date.now()}`, title: goalForm.title.trim(), icon: goalForm.icon, target, saved: 0, color: GOAL_COLORS[goals.length % GOAL_COLORS.length] }]);
    setGoalForm({ title: "", target: "", icon: "🎯" }); setShowGoalForm(false);
  };

  const handleAddToGoal = (id, amt) => {
    const goal = goals.find((g) => g.id === id);
    if (!goal) return;
    const remaining = Math.max(0, goal.target - goal.saved);
    const actualAmt = Math.min(amt, remaining);
    if (actualAmt <= 0) return;
    const nowIso = new Date().toISOString().slice(0, 16);
    const newTx = { id: `tx_${Date.now()}`, type: "expense", name: `Savings: ${goal.title}`, category: "Savings", amount: actualAmt, date: nowIso, source: "savings", goalId: id };
    const updatedTx = [newTx, ...transactions];
    const updatedGoals = goals.map((g) => g.id === id ? { ...g, saved: g.saved + actualAmt } : g);
    saveTx(updatedTx);
    saveGoals(updatedGoals);
  };

  const handleWithdrawFromGoal = (id, amt) => {
    const goal = goals.find((g) => g.id === id);
    if (!goal || goal.saved <= 0) return;
    const actualAmt = Math.min(amt, goal.saved);
    const nowIso = new Date().toISOString().slice(0, 16);
    const newTx = { id: `tx_${Date.now()}`, type: "income", name: `Withdraw: ${goal.title}`, category: "Savings", amount: actualAmt, date: nowIso, source: "savings", goalId: id };
    const updatedTx = [newTx, ...transactions];
    const updatedGoals = goals.map((g) => g.id === id ? { ...g, saved: g.saved - actualAmt } : g);
    saveTx(updatedTx);
    saveGoals(updatedGoals);
  };

  const handleDeleteGoal = (id) => {
    const goal = goals.find((g) => g.id === id);
    if (!goal) return;
    if (goal.saved > 0) {
      const nowIso = new Date().toISOString().slice(0, 16);
      const newTx = { id: `tx_${Date.now()}`, type: "income", name: `Refund: ${goal.title}`, category: "Savings", amount: goal.saved, date: nowIso, source: "savings" };
      saveTx([newTx, ...transactions]);
    }
    saveGoals(goals.filter((g) => g.id !== id));
  };

  const sortedTx = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q) || t.amount.toString().includes(q);
  });

  const totalScheduled = scheduled.reduce((s, p) => s + p.amount, 0);
  const editCategories = editForm.type === "expense" ? allExpCat : allIncCat;

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
              {/* Left */}
              <div className="tx-left">
                <div className="tx-card card-soft">
                  <h3 className="tx-card__title">Add Transaction</h3>
                  <div className="tx-type-toggle">
                    <button type="button" className={`tx-type-btn ${txForm.type === "expense" ? "tx-type-btn--active tx-type-btn--expense" : ""}`} onClick={() => handleTypeSwitch("expense")}>Expense</button>
                    <button type="button" className={`tx-type-btn ${txForm.type === "income" ? "tx-type-btn--active tx-type-btn--income" : ""}`} onClick={() => handleTypeSwitch("income")}>Income</button>
                  </div>
                  <div className="tx-form">
                    <input type="text" placeholder="Transaction name" value={txForm.name} onChange={(e) => setTxForm((p) => ({ ...p, name: e.target.value }))} className="tx-input" />
                    <input type="number" placeholder="Amount (£)" value={txForm.amount} onChange={(e) => setTxForm((p) => ({ ...p, amount: e.target.value }))} className="tx-input" min="0" step="0.01" />
                    <div className="tx-category-row">
                      {!showNewCategory && (
                        <select value={txForm.category} onChange={(e) => setTxForm((p) => ({ ...p, category: e.target.value }))} className="tx-select">
                          {currentCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      )}
                      {showNewCategory && (
                        <>
                          <input type="text" placeholder="New category name" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="tx-input" onKeyDown={(e) => e.key === "Enter" && handleAddCategory()} autoFocus />
                          <button type="button" className="tx-submit tx-submit--sm" onClick={handleAddCategory}>Add</button>
                        </>
                      )}
                      <button
                        type="button"
                        className={`tx-toggle-btn ${showNewCategory ? "tx-toggle-btn--open" : ""}`}
                        onClick={() => setShowNewCategory(!showNewCategory)}
                      >
                        <span className="tx-toggle-btn__icon">+</span>
                      </button>
                    </div>
                    <input type="datetime-local" value={txForm.date} onChange={(e) => setTxForm((p) => ({ ...p, date: e.target.value }))} className="tx-input" />
                    <button type="button" className="tx-submit" onClick={handleAddTransaction}>Add Transaction</button>
                  </div>
                </div>

                <div className="tx-card card-soft">
                  <h3 className="tx-card__title">Add Scheduled Payment</h3>
                  <div className="tx-form">
                    <select value={showCustomService ? "__custom" : spForm.preset} onChange={(e) => handlePresetSelect(e.target.value)} className="tx-select">
                      <option value="" disabled>Select a service...</option>
                      {PRESET_SERVICES.map((s) => <option key={s.name} value={s.name}>{s.name} — £{s.amount}</option>)}
                      <option value="__custom">+ Custom service</option>
                    </select>
                    {showCustomService && <input type="text" placeholder="Service name" value={spForm.name} onChange={(e) => setSpForm((p) => ({ ...p, name: e.target.value }))} className="tx-input" />}
                    <input type="number" placeholder="Amount (£)" value={spForm.amount} onChange={(e) => setSpForm((p) => ({ ...p, amount: e.target.value }))} className="tx-input" min="0" step="0.01" />
                    <select value={spForm.frequency} onChange={(e) => setSpForm((p) => ({ ...p, frequency: e.target.value }))} className="tx-select">
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                    <label className="tx-field-label">Subscription start date</label>
                    <input type="date" value={spForm.startDate} onChange={(e) => setSpForm((p) => ({ ...p, startDate: e.target.value }))} className="tx-input" />
                    <button type="button" className="tx-submit" onClick={handleAddScheduled}>Add Scheduled Payment</button>
                  </div>
                </div>

                <div className="tx-card card-soft">
                  <div className="tx-card__header">
                    <h3 className="tx-card__title">Savings Goals</h3>
                    <button type="button" className={`tx-toggle-btn ${showGoalForm ? "tx-toggle-btn--open" : ""}`} onClick={() => setShowGoalForm(!showGoalForm)}><span className="tx-toggle-btn__icon">+</span></button>
                  </div>
                  {showGoalForm && (
                    <div className="tx-form" style={{ marginBottom: 14 }}>
                      <div className="goal-icon-row">
                        {GOAL_ICONS.map((icon) => <button key={icon} type="button" className={`goal-icon-btn ${goalForm.icon === icon ? "goal-icon-btn--active" : ""}`} onClick={() => setGoalForm((p) => ({ ...p, icon }))}>{icon}</button>)}
                      </div>
                      <input type="text" placeholder="Goal name" value={goalForm.title} onChange={(e) => setGoalForm((p) => ({ ...p, title: e.target.value }))} className="tx-input" />
                      <input type="number" placeholder="Target (£)" value={goalForm.target} onChange={(e) => setGoalForm((p) => ({ ...p, target: e.target.value }))} className="tx-input" min="0" />
                      <button type="button" className="tx-submit" onClick={handleAddGoal}>Create Goal</button>
                    </div>
                  )}
                  {goals.length === 0 && !showGoalForm && <p className="tx-empty">No savings goals yet.</p>}
                  <div className="tx-savings-list">
                    {goals.map((g) => {
                      const pct = g.target > 0 ? Math.round((g.saved / g.target) * 100) : 0;
                      const done = g.saved >= g.target;
                      return (
                        <div key={g.id} className="tx-savings-item">
                          <button type="button" className="tx-savings-delete" onClick={() => handleDeleteGoal(g.id)}>×</button>
                          <SavingsPanel title={g.title} leftAmount={`£${(g.saved || 0).toLocaleString()}`} percent={pct} target={`£${g.target.toLocaleString()}`} progressValue={pct} />
                          <div className="tx-savings-actions">
                            {!done && (
                              <>
                                <button type="button" className="goal-add-btn" onClick={() => handleAddToGoal(g.id, 10)}>+£10</button>
                                <button type="button" className="goal-add-btn" onClick={() => handleAddToGoal(g.id, 50)}>+£50</button>
                                <button type="button" className="goal-add-btn" onClick={() => handleAddToGoal(g.id, 100)}>+£100</button>
                              </>
                            )}
                            {done && <span className="goal-done-badge">Done!</span>}
                            {g.saved > 0 && (
                              <button
                                type="button"
                                className={`goal-add-btn goal-withdraw-btn ${withdrawingGoalId === g.id ? "goal-withdraw-btn--open" : ""}`}
                                onClick={() => {
                                  if (withdrawingGoalId === g.id) { setWithdrawingGoalId(null); setWithdrawAmount(""); }
                                  else { setWithdrawingGoalId(g.id); setWithdrawAmount(""); }
                                }}
                                title="Withdraw back to balance"
                              >
                                {withdrawingGoalId === g.id ? "Cancel" : "Withdraw"}
                              </button>
                            )}
                          </div>

                          {withdrawingGoalId === g.id && (
                            <div className="goal-withdraw-form">
                              <input
                                type="number"
                                placeholder={`Max £${g.saved.toLocaleString()}`}
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                className="tx-input tx-input--sm"
                                min="0"
                                max={g.saved}
                                step="0.01"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    const amt = Number(withdrawAmount);
                                    if (amt > 0 && amt <= g.saved) {
                                      handleWithdrawFromGoal(g.id, amt);
                                      setWithdrawingGoalId(null);
                                      setWithdrawAmount("");
                                    }
                                  }
                                }}
                              />
                              <button
                                type="button"
                                className="tx-submit tx-submit--sm"
                                onClick={() => {
                                  const amt = Number(withdrawAmount);
                                  if (amt > 0 && amt <= g.saved) {
                                    handleWithdrawFromGoal(g.id, amt);
                                    setWithdrawingGoalId(null);
                                    setWithdrawAmount("");
                                  }
                                }}
                              >
                                Withdraw
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right */}
              <div className="tx-right">
                <div className="tx-tabs">
                  <button className={`tx-tab ${activeTab === "transactions" ? "tx-tab--active" : ""}`} onClick={() => setActiveTab("transactions")}>Transactions ({transactions.length})</button>
                  <button className={`tx-tab ${activeTab === "scheduled" ? "tx-tab--active" : ""}`} onClick={() => setActiveTab("scheduled")}>Scheduled ({scheduled.length})</button>
                </div>

                {activeTab === "transactions" && (
                  <div className="tx-card card-soft tx-list-card">
                    <div className="tx-list-header">
                      <h3 className="tx-card__title" style={{ margin: 0 }}>All Transactions</h3>
                      <input type="text" placeholder="Search transactions..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="tx-input tx-search-input" />
                    </div>
                    {sortedTx.length === 0 ? (
                      <p className="tx-empty">{searchQuery ? "No transactions found." : "No transactions yet. Add your first one!"}</p>
                    ) : (
                      <div className="tx-list">
                        {sortedTx.map((tx) => (
                          <div key={tx.id} className="tx-row">
                            {editingTx === tx.id ? (
                              <div className="tx-row-edit">
                                <div className="tx-row-edit__fields">
                                  <div className="tx-row-edit__field">
                                    <label className="tx-field-label">Name</label>
                                    <input type="text" value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} className="tx-input tx-input--sm" />
                                  </div>
                                  <div className="tx-row-edit__field">
                                    <label className="tx-field-label">Amount (£)</label>
                                    <input type="number" value={editForm.amount} onChange={(e) => setEditForm((p) => ({ ...p, amount: e.target.value }))} className="tx-input tx-input--sm" min="0" step="0.01" />
                                  </div>
                                  <div className="tx-row-edit__field">
                                    <label className="tx-field-label">Category</label>
                                    <select value={editForm.category} onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value }))} className="tx-select tx-select--sm">{editCategories.map((c) => <option key={c} value={c}>{c}</option>)}</select>
                                  </div>
                                  <div className="tx-row-edit__field">
                                    <label className="tx-field-label">Type</label>
                                    <select value={editForm.type} onChange={(e) => setEditForm((p) => ({ ...p, type: e.target.value }))} className="tx-select tx-select--sm"><option value="expense">Expense</option><option value="income">Income</option></select>
                                  </div>
                                </div>
                                <div className="tx-row-edit__actions">
                                  <button className="tx-row-btn tx-row-btn--save" onClick={() => handleSaveEdit(tx.id)}>Save</button>
                                  <button className="tx-row-btn tx-row-btn--cancel" onClick={() => setEditingTx(null)}>Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className={`tx-row__dot tx-row__dot--${tx.type}`} />
                                <div className="tx-row__info">
                                  <span className="tx-row__name">{tx.name}</span>
                                  <span className="tx-row__meta">{tx.category} · {formatDate(tx.date)} · {formatTime(tx.date)}</span>
                                </div>
                                <span className={`tx-row__amount tx-row__amount--${tx.type}`}>{tx.type === "expense" ? "-" : "+"}£{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                <div className="tx-row__actions">
                                  <button className="tx-row-btn" onClick={() => handleStartEdit(tx)}>Edit</button>
                                  <button className="tx-row-btn tx-row-btn--del" onClick={() => handleDeleteTx(tx.id)}>×</button>
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
                    {scheduled.length === 0 ? <p className="tx-empty">No scheduled payments yet.</p> : (
                      <>
                        <div className="sp-total">Total monthly: <strong>£{totalScheduled.toFixed(2)}</strong></div>
                        <div className="tx-list">
                          {scheduled.map((sp) => (
                            <div key={sp.id} className="tx-row">
                              <div className="tx-row__dot tx-row__dot--expense" />
                              <div className="tx-row__info">
                                <span className="tx-row__name">{sp.name}</span>
                                <span className="tx-row__meta">
                                  {sp.frequency}
                                  {sp.startDate && ` · since ${formatDate(sp.startDate)}`}
                                </span>
                              </div>
                              <span className="tx-row__amount tx-row__amount--expense">£{sp.amount.toFixed(2)}</span>
                              <div className="tx-row__actions"><button className="tx-row-btn tx-row-btn--del" onClick={() => handleDeleteScheduled(sp.id)}>×</button></div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};