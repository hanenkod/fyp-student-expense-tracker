import { useState } from "react";
import { SavingsPanel } from "./SavingsPanel";
import { ConfirmModal } from "./ConfirmModal";
import { useSettings } from "./SettingsContext";
import { useToast } from "./ToastContext";
import { saveJSON, STORAGE_KEYS } from "../utils/storage";

const GOAL_ICONS = ["🛡️","✈️","🏠","💻","🎓","🚗","💰","🎁","📱","🎯"];
const GOAL_COLORS = ["#2fae52","#4f518c","#907ad6","#e07c4a","#d65c8a","#3d9be9"];

export const SavingsGoals = ({
  goals,
  onGoalsChange,
  transactions,
  onTransactionsChange,
}) => {
  const { formatMoney, currencyInfo } = useSettings();
  const { showToast } = useToast();

  const [goalForm, setGoalForm] = useState({ title: "", target: "", icon: "🎯" });
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [withdrawingGoalId, setWithdrawingGoalId] = useState(null);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);  // goal object awaiting confirm

  const persistGoals = (u) => { onGoalsChange(u); saveJSON(STORAGE_KEYS.GOALS, u); };
  const persistTx = (u) => { onTransactionsChange(u); saveJSON(STORAGE_KEYS.TRANSACTIONS, u); };

  const handleAddGoal = () => {
    if (!goalForm.title.trim()) {
      showToast("Please enter a goal name", { type: "error" });
      return;
    }
    const target = parseFloat(goalForm.target);
    if (isNaN(target) || target <= 0) {
      showToast("Target must be greater than zero", { type: "error" });
      return;
    }
    const newGoal = {
      id: `sg_${Date.now()}`,
      title: goalForm.title.trim(),
      icon: goalForm.icon,
      target,
      saved: 0,
      color: GOAL_COLORS[goals.length % GOAL_COLORS.length],
    };
    persistGoals([...goals, newGoal]);
    setGoalForm({ title: "", target: "", icon: "🎯" });
    setShowGoalForm(false);
    showToast(`New goal created: ${newGoal.title}`, { type: "success" });
  };

  const handleAddToGoal = (id, amt) => {
    const goal = goals.find((g) => g.id === id);
    if (!goal) return;
    const remaining = Math.max(0, goal.target - goal.saved);
    const actualAmt = Math.min(amt, remaining);
    if (actualAmt <= 0) return;

    const nowIso = new Date().toISOString().slice(0, 16);
    const newTx = {
      id: `tx_${Date.now()}`, type: "expense",
      name: `Savings: ${goal.title}`, category: "Savings",
      amount: actualAmt, date: nowIso, source: "savings", goalId: id,
    };
    persistTx([newTx, ...transactions]);
    const updatedGoals = goals.map((g) => g.id === id ? { ...g, saved: g.saved + actualAmt } : g);
    persistGoals(updatedGoals);

    const updatedGoal = updatedGoals.find((g) => g.id === id);
    if (updatedGoal && updatedGoal.saved >= updatedGoal.target) {
      showToast(`🎉 Goal reached: ${goal.title}!`, { type: "success", duration: 4000 });
    } else {
      showToast(`${formatMoney(actualAmt)} added to ${goal.title}`, { type: "success" });
    }
  };

  const handleWithdrawFromGoal = (id, amt) => {
    const goal = goals.find((g) => g.id === id);
    if (!goal || goal.saved <= 0) return;
    const actualAmt = Math.min(amt, goal.saved);

    const nowIso = new Date().toISOString().slice(0, 16);
    const newTx = {
      id: `tx_${Date.now()}`, type: "income",
      name: `Withdraw: ${goal.title}`, category: "Savings",
      amount: actualAmt, date: nowIso, source: "savings", goalId: id,
    };
    persistTx([newTx, ...transactions]);
    persistGoals(goals.map((g) => g.id === id ? { ...g, saved: g.saved - actualAmt } : g));
    showToast(`${formatMoney(actualAmt)} withdrawn from ${goal.title}`, { type: "info" });
  };

  const handleDeleteGoal = (id) => {
    const goal = goals.find((g) => g.id === id);
    if (!goal) return;
    setPendingDelete(goal);
  };

  const confirmDelete = () => {
    const goal = pendingDelete;
    if (!goal) return;

    if (goal.saved > 0) {
      const nowIso = new Date().toISOString().slice(0, 16);
      const newTx = {
        id: `tx_${Date.now()}`, type: "income",
        name: `Refund: ${goal.title}`, category: "Savings",
        amount: goal.saved, date: nowIso, source: "savings",
      };
      persistTx([newTx, ...transactions]);
    }
    persistGoals(goals.filter((g) => g.id !== goal.id));
    showToast(
      `Goal deleted: ${goal.title}${goal.saved > 0 ? ` (${formatMoney(goal.saved)} refunded)` : ""}`,
      { type: "info" }
    );
    setPendingDelete(null);
  };

  return (
    <div className="tx-card card-soft">
      <ConfirmModal
        open={!!pendingDelete}
        title={`Delete goal "${pendingDelete?.title}"?`}
        message={
          pendingDelete?.saved > 0
            ? `${formatMoney(pendingDelete.saved)} will be refunded to your balance.`
            : "This action cannot be undone."
        }
        confirmLabel="Delete goal"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
      <div className="tx-card__header">
        <h3 className="tx-card__title">Savings Goals</h3>
        <button
          type="button"
          className={`tx-toggle-btn ${showGoalForm ? "tx-toggle-btn--open" : ""}`}
          onClick={() => setShowGoalForm(!showGoalForm)}
          aria-label={showGoalForm ? "Cancel new goal" : "Add new goal"}
          aria-expanded={showGoalForm}
        >
          <span className="tx-toggle-btn__icon">+</span>
        </button>
      </div>

      {showGoalForm && (
        <div className="tx-form" style={{ marginBottom: 12 }}>
          <div className="goal-icon-row">
            {GOAL_ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                className={`goal-icon-btn ${goalForm.icon === icon ? "goal-icon-btn--active" : ""}`}
                onClick={() => setGoalForm((p) => ({ ...p, icon }))}
                aria-label={`Icon ${icon}`}
                aria-pressed={goalForm.icon === icon}
              >
                {icon}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Goal name"
            value={goalForm.title}
            onChange={(e) => setGoalForm((p) => ({ ...p, title: e.target.value }))}
            className="tx-input"
            aria-label="Goal name"
          />
          <div className="tx-amount-wrap">
            <span className="tx-amount-symbol" aria-hidden="true">{currencyInfo.symbol}</span>
            <input
              type="number"
              placeholder="Target amount"
              value={goalForm.target}
              onChange={(e) => setGoalForm((p) => ({ ...p, target: e.target.value }))}
              className="tx-input tx-input--with-prefix"
              min="0"
              aria-label="Target amount"
            />
          </div>
          <button type="button" className="tx-submit" onClick={handleAddGoal}>
            Create Goal
          </button>
        </div>
      )}

      {goals.length === 0 && !showGoalForm && (
        <p className="tx-empty">No savings goals yet.</p>
      )}

      <div className="tx-savings-list">
        {goals.map((g) => {
          const pct = g.target > 0 ? Math.round((g.saved / g.target) * 100) : 0;
          const done = g.saved >= g.target;
          return (
            <div key={g.id} className="tx-savings-item">
              <button
                type="button"
                className="tx-savings-delete"
                onClick={() => handleDeleteGoal(g.id)}
                aria-label={`Delete ${g.title}`}
              >
                ×
              </button>
              <SavingsPanel
                title={g.title}
                leftAmount={formatMoney(g.saved || 0)}
                percent={pct}
                target={formatMoney(g.target)}
                progressValue={pct}
              />
              <div className="tx-savings-actions">
                {!done && (
                  <>
                    <button type="button" className="goal-add-btn" onClick={() => handleAddToGoal(g.id, 10)}>+{currencyInfo.symbol}10</button>
                    <button type="button" className="goal-add-btn" onClick={() => handleAddToGoal(g.id, 50)}>+{currencyInfo.symbol}50</button>
                    <button type="button" className="goal-add-btn" onClick={() => handleAddToGoal(g.id, 100)}>+{currencyInfo.symbol}100</button>
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
                    aria-label={`Withdraw from ${g.title}`}
                  >
                    {withdrawingGoalId === g.id ? "Cancel" : "Withdraw"}
                  </button>
                )}
              </div>

              {withdrawingGoalId === g.id && (
                <div className="goal-withdraw-form">
                  <input
                    type="number"
                    placeholder={`Max ${formatMoney(g.saved)}`}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="tx-input tx-input--sm"
                    min="0"
                    max={g.saved}
                    step="0.01"
                    autoFocus
                    aria-label={`Withdraw amount from ${g.title}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const amt = Number(withdrawAmount);
                        if (amt > 0 && amt <= g.saved) {
                          handleWithdrawFromGoal(g.id, amt);
                          setWithdrawingGoalId(null);
                          setWithdrawAmount("");
                        } else {
                          showToast(`Withdraw must be between ${formatMoney(0.01)} and ${formatMoney(g.saved)}`, { type: "error" });
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
                      } else {
                        showToast(`Withdraw must be between ${formatMoney(0.01)} and ${formatMoney(g.saved)}`, { type: "error" });
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
  );
};