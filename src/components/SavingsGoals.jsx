/**
 * SavingsGoals — left-column card on the Transactions page.
 *
 * Lists the user's goals with progress bars and exposes the four
 * actions: create new, contribute (£10 / £50 / £100 buttons),
 * withdraw, and delete. Add and withdraw call the dedicated
 * /api/goals/:id/add and /withdraw endpoints, which atomically
 * write a matching expense/income transaction so the user's
 * totals stay consistent.
 */
import { useState } from "react";
import { SavingsPanel } from "./SavingsPanel";
import { ConfirmModal } from "./ConfirmModal";
import { useSettings } from "./SettingsContext";
import { useToast } from "./ToastContext";
import { useData } from "./DataContext";

const GOAL_ICONS = ["🛡️","✈️","🏠","💻","🎓","🚗","💰","🎁","📱","🎯"];
const GOAL_COLORS = ["#2fae52","#4f518c","#907ad6","#e07c4a","#d65c8a","#3d9be9"];

export const SavingsGoals = () => {
  const { formatMoney, currencyInfo } = useSettings();
  const { showToast } = useToast();
  const { goals, addGoal, removeGoal, addToGoal, withdrawFromGoal } = useData();

  const [goalForm, setGoalForm] = useState({ title: "", target: "", icon: "🎯" });
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [withdrawingGoalId, setWithdrawingGoalId] = useState(null);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);

  const handleAddGoal = async () => {
    if (!goalForm.title.trim()) {
      showToast("Please enter a goal name", { type: "error" });
      return;
    }
    const target = parseFloat(goalForm.target);
    if (isNaN(target) || target <= 0) {
      showToast("Target must be greater than zero", { type: "error" });
      return;
    }
    try {
      const created = await addGoal({
        title: goalForm.title.trim(),
        icon: goalForm.icon,
        target,
        saved: 0,
        color: GOAL_COLORS[goals.length % GOAL_COLORS.length],
      });
      setGoalForm({ title: "", target: "", icon: "🎯" });
      setShowGoalForm(false);
      showToast(`New goal created: ${created.title}`, { type: "success" });
    } catch (err) {
      showToast(err?.body?.error || "Could not create goal", { type: "error" });
    }
  };

  const handleAddToGoal = async (id, amt) => {
    try {
      const result = await addToGoal(id, amt);
      const goal = result.goal;
      if (goal.saved >= goal.target) {
        showToast(`🎉 Goal reached: ${goal.title}!`, { type: "success", duration: 4000 });
      } else {
        showToast(`${formatMoney(amt)} added to ${goal.title}`, { type: "success" });
      }
    } catch (err) {
      showToast(err?.body?.error || "Could not add to goal", { type: "error" });
    }
  };

  const handleWithdraw = async (id, amt) => {
    try {
      const result = await withdrawFromGoal(id, amt);
      showToast(`${formatMoney(amt)} withdrawn from ${result.goal.title}`, { type: "info" });
    } catch (err) {
      showToast(err?.body?.error || "Could not withdraw", { type: "error" });
    }
  };

  const confirmDelete = async () => {
    const goal = pendingDelete;
    if (!goal) return;
    try {
      await removeGoal(goal.id);
      showToast(
        `Goal deleted: ${goal.title}${goal.saved > 0 ? ` (${formatMoney(goal.saved)} refunded)` : ""}`,
        { type: "info" }
      );
    } catch (err) {
      showToast(err?.body?.error || "Could not delete goal", { type: "error" });
    } finally {
      setPendingDelete(null);
    }
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
              >{icon}</button>
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
          <button type="button" className="tx-submit" onClick={handleAddGoal}>Create Goal</button>
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
                onClick={() => setPendingDelete(g)}
                aria-label={`Delete ${g.title}`}
              >×</button>
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
                    onKeyDown={async (e) => {
                      if (e.key === "Enter") {
                        const amt = Number(withdrawAmount);
                        if (amt > 0 && amt <= g.saved) {
                          await handleWithdraw(g.id, amt);
                          setWithdrawingGoalId(null);
                          setWithdrawAmount("");
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="tx-submit tx-submit--sm"
                    onClick={async () => {
                      const amt = Number(withdrawAmount);
                      if (amt > 0 && amt <= g.saved) {
                        await handleWithdraw(g.id, amt);
                        setWithdrawingGoalId(null);
                        setWithdrawAmount("");
                      }
                    }}
                  >Withdraw</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
