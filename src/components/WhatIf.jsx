/**
 * WhatIf — interactive scenario planner.
 *
 * Lets the user model the impact of four kinds of change on their
 * budget without actually modifying any data:
 *   1. Cancel a subscription
 *   2. Adjust a category budget
 *   3. Save a fixed amount per month towards a goal
 *   4. Change overall income
 *
 * All calculations happen in-memory; nothing is persisted. Replaced
 * the older Analytics page (the /analytics route still redirects here).
 */
import { useState, useMemo } from "react";
import { Sidebar } from "./Sidebar";
import { useSettings } from "./SettingsContext";
import { useToast } from "./ToastContext";
import { useAuth } from "./AuthContext";
import { useData } from "./DataContext";
import { LoadingScreen } from "./LoadingScreen";
import { isInCurrentMonth, getDaysInMonth, getDaysLeftInMonth } from "../utils/date";
import "../styles/style.css";
import "../styles/whatif.css";

const SCENARIO_TYPES = [
  { id: "purchase", label: "One-time purchase", icon: "🛒", hint: "e.g. new laptop for £800" },
  { id: "recurring", label: "Recurring expense", icon: "🔄", hint: "e.g. £50 per week" },
  { id: "cancel_sub", label: "Cancel subscription", icon: "✕", hint: "stop paying for an existing subscription" },
  { id: "income_change", label: "Income change", icon: "💼", hint: "one-time bonus or salary adjustment" },
];

const FREQUENCY_PER_MONTH = { daily: 30, weekly: 4, monthly: 1 };

export const WhatIf = () => {
  const { formatMoney, currencyInfo } = useSettings();
  const { showToast } = useToast();

  const { user } = useAuth();
  const { transactions: allTransactions, scheduled: scheduledPayments, goals, loading } = useData();

  const onboardingData = { income: user?.income || 0, expenses: user?.expenses || 0 };

  if (loading) {
    return <LoadingScreen />;
  }

  const baseIncome = Number(onboardingData.income || 0);

  const [scenarios, setScenarios] = useState([]);
  const [draft, setDraft] = useState({ type: "purchase", label: "", amount: "", frequency: "weekly", targetSubId: "" });

  const now = new Date();

  const thisMonthTx = allTransactions.filter((t) => isInCurrentMonth(t.date, now));

  const spentSoFar = thisMonthTx
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount || 0), 0);

  const incomeSoFar = thisMonthTx
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount || 0), 0);

  const daysInMonth = getDaysInMonth(now);
  const daysLeft = Math.max(1, getDaysLeftInMonth(now));

  // Historical average daily spend from last 30 days (rolling)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentExpenses = allTransactions
    .filter((t) => t.type === "expense" && new Date(t.date) >= thirtyDaysAgo)
    .reduce((s, t) => s + Number(t.amount || 0), 0);
  const avgDailySpend = recentExpenses / 30;

  // Scheduled payments that will charge again this month
  const remainingScheduled = scheduledPayments.reduce((sum, sp) => {
    if (sp.frequency === "monthly") return sum + Number(sp.amount);
    if (sp.frequency === "weekly") return sum + Number(sp.amount) * Math.ceil(daysLeft / 7);
    return sum;
  }, 0);

  // Monthly saving pace estimate (last 30d income to goals)
  const monthlySavingPace = allTransactions
    .filter((t) => t.source === "savings" && t.type === "expense" && new Date(t.date) >= thirtyDaysAgo)
    .reduce((s, t) => s + Number(t.amount || 0), 0);

  // ── Base projection (no scenarios) ──
  // ── Base projection (no scenarios) ──
  // Current balance = baseline monthly income minus what's been spent this month (matches Dashboard).
  // Projected balance assumes average historical spending continues for the rest of the month.
  const baseProjection = useMemo(() => {
    const expectedRemainingSpend = avgDailySpend * daysLeft + remainingScheduled;
    const projectedTotalSpend = spentSoFar + expectedRemainingSpend;
    const currentBalance = Math.max(0, baseIncome + incomeSoFar - spentSoFar);
    const projectedBalance = baseIncome + incomeSoFar - projectedTotalSpend;
    const safeToSpendNow = daysLeft > 0 ? Math.max(0, currentBalance - remainingScheduled) / daysLeft : 0;
    return {
      currentBalance,
      projectedTotalSpend,
      projectedBalance,
      safeToSpendNow,
    };
  }, [baseIncome, incomeSoFar, spentSoFar, avgDailySpend, daysLeft, remainingScheduled]);

  // ── Apply scenarios to projection ──
  const scenarioImpact = useMemo(() => {
    let extraExpense = 0;
    let extraIncome = 0;
    let savedSubscriptions = 0;

    scenarios.forEach((s) => {
      const amt = Number(s.amount || 0);
      if (s.type === "purchase") {
        extraExpense += amt;
      } else if (s.type === "recurring") {
        const perMonth = FREQUENCY_PER_MONTH[s.frequency] || 1;
        const occurrencesLeft = Math.ceil((daysLeft / 30) * perMonth);
        extraExpense += amt * occurrencesLeft;
      } else if (s.type === "cancel_sub") {
        const sub = scheduledPayments.find((sp) => sp.id === s.targetSubId);
        if (sub) {
          let monthlyAmount = Number(sub.amount);
          if (sub.frequency === "weekly") monthlyAmount = Number(sub.amount) * 4;
          if (sub.frequency === "yearly") monthlyAmount = Number(sub.amount) / 12;
          const savedThisMonth = (monthlyAmount * daysLeft) / 30;
          extraExpense -= savedThisMonth;
          savedSubscriptions += savedThisMonth;
        }
      } else if (s.type === "income_change") {
        extraIncome += amt;
      }
    });

    return { extraExpense, extraIncome, savedSubscriptions };
  }, [scenarios, scheduledPayments, daysLeft]);

  const withScenarios = useMemo(() => {
    const projectedBalance = baseProjection.projectedBalance - scenarioImpact.extraExpense + scenarioImpact.extraIncome;
    const currentBalance = baseProjection.currentBalance + scenarioImpact.extraIncome - (scenarios.filter((s) => s.type === "purchase").reduce((sum, s) => sum + Number(s.amount || 0), 0));
    const safeToSpendNow = daysLeft > 0 ? Math.max(0, currentBalance - remainingScheduled) / daysLeft : 0;
    const safeToSpendEndOfMonth = daysLeft > 0 ? Math.max(0, projectedBalance) / daysLeft : 0;

    return {
      currentBalance,
      projectedBalance,
      safeToSpendNow,
      safeToSpendEndOfMonth,
    };
  }, [baseProjection, scenarioImpact, scenarios, daysLeft, remainingScheduled]);

  // ── Goal impact ──
  const goalImpact = useMemo(() => {
    if (goals.length === 0 || monthlySavingPace === 0) return [];
    const netCashImpact = scenarioImpact.extraExpense - scenarioImpact.extraIncome - scenarioImpact.savedSubscriptions;
    const delayMonths = netCashImpact > 0 ? netCashImpact / monthlySavingPace : 0;

    return goals
      .filter((g) => g.saved < g.target)
      .map((g) => {
        let delayText = "No impact";
        let delayKind = "neutral";

        if (delayMonths > 0) {
          delayKind = "bad";
          if (delayMonths >= 12) {
            const years = Math.round(delayMonths / 12 * 10) / 10;
            delayText = `+${years} year${years === 1 ? "" : "s"} longer to reach`;
          } else if (delayMonths >= 1) {
            const months = Math.round(delayMonths * 10) / 10;
            delayText = `+${months} month${months === 1 ? "" : "s"} longer to reach`;
          } else {
            const days = Math.max(1, Math.round(delayMonths * 30));
            delayText = `+${days} day${days === 1 ? "" : "s"} longer to reach`;
          }
        } else if (delayMonths < 0) {
          delayKind = "good";
          const days = Math.abs(Math.round(delayMonths * 30));
          delayText = `${days} day${days === 1 ? "" : "s"} sooner!`;
        }

        return {
          title: g.title,
          icon: g.icon,
          delayText,
          delayKind,
        };
      });
  }, [goals, scenarioImpact, monthlySavingPace]);

  // ── Warnings ──
  const warnings = useMemo(() => {
    const list = [];
    if (withScenarios.currentBalance < 0) {
      list.push({ type: "danger", text: `Your balance would go negative (${formatMoney(withScenarios.currentBalance)}). You cannot afford this right now.` });
    } else if (withScenarios.projectedBalance < 0) {
      list.push({ type: "danger", text: `You would run out of money before the end of the month. Projected shortfall: ${formatMoney(Math.abs(withScenarios.projectedBalance))}.` });
    } else if (withScenarios.projectedBalance < baseIncome * 0.1) {
      list.push({ type: "warning", text: `You would end the month with less than 10% of your income left (${formatMoney(withScenarios.projectedBalance)}). Cutting it close.` });
    }

    if (withScenarios.safeToSpendEndOfMonth < avgDailySpend * 0.5 && avgDailySpend > 0) {
      list.push({ type: "warning", text: `Daily spending allowance (${formatMoney(withScenarios.safeToSpendEndOfMonth, { minFractionDigits: 2, maxFractionDigits: 2 })}) would be well below your usual pace (${formatMoney(avgDailySpend, { minFractionDigits: 2, maxFractionDigits: 2 })}/day).` });
    }

    return list;
  }, [withScenarios, baseIncome, avgDailySpend, formatMoney]);

  const handleAddScenario = () => {
    if (draft.type === "cancel_sub") {
      if (!draft.targetSubId) return;
      const sub = scheduledPayments.find((sp) => sp.id === draft.targetSubId);
      if (!sub) return;
      setScenarios([...scenarios, { id: `sc_${Date.now()}`, type: draft.type, label: `Cancel ${sub.name}`, amount: sub.amount, targetSubId: sub.id }]);
      showToast(`Scenario added: Cancel ${sub.name}`, { type: "success" });
    } else {
      const amt = Number(draft.amount);
      if (!draft.amount || amt === 0) return;
      if (draft.type !== "income_change" && amt <= 0) return;
      const labels = {
        purchase: draft.label.trim() || "One-time purchase",
        recurring: draft.label.trim() || `Recurring (${draft.frequency})`,
        income_change: draft.label.trim() || (amt >= 0 ? "Income gain" : "Income loss"),
      };
      setScenarios([...scenarios, { id: `sc_${Date.now()}`, type: draft.type, label: labels[draft.type], amount: amt, frequency: draft.frequency }]);
      showToast(`Scenario added: ${labels[draft.type]}`, { type: "success" });
    }
    setDraft({ type: draft.type, label: "", amount: "", frequency: "weekly", targetSubId: "" });
  };

  const handleRemoveScenario = (id) => {
    const s = scenarios.find((s) => s.id === id);
    setScenarios(scenarios.filter((sc) => sc.id !== id));
    if (s) showToast(`Scenario removed`, { type: "info" });
  };

  const handleClearAll = () => {
    setScenarios([]);
    showToast("All scenarios cleared", { type: "info" });
  };

  const scenarioTypeInfo = SCENARIO_TYPES.find((t) => t.id === draft.type);

  // Delta between baseline and scenario
  const deltaProjected = withScenarios.projectedBalance - baseProjection.projectedBalance;
  const deltaSafeToSpend = withScenarios.safeToSpendEndOfMonth - (baseProjection.projectedBalance / daysLeft);

  return (
    <div className="dashboard">
      <div className="app-shell">
        <div className="layout">
          <Sidebar />

          <main className="content">
            <header className="overview card card-soft card-overview">
              <div className="overview-bar">
                <div className="overview-text stack-5">
                  <h1 className="overview-title">What-If Planner</h1>
                  <p className="overview-subtitle">Simulate financial decisions — nothing here is saved, your real data stays untouched</p>
                </div>
              </div>
            </header>

            <div className="whatif-layout">
              {/* ── Left column ── */}
              <div className="whatif-left">
                {/* Scenario builder */}
                <div className="whatif-card card-soft">
                  <h3 className="whatif-card__title">Add a scenario</h3>

                  <div className="whatif-type-grid">
                    {SCENARIO_TYPES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        className={`whatif-type-btn ${draft.type === t.id ? "whatif-type-btn--active" : ""}`}
                        onClick={() => setDraft({ ...draft, type: t.id })}
                      >
                        <span className="whatif-type-btn__icon">{t.icon}</span>
                        <span className="whatif-type-btn__label">{t.label}</span>
                      </button>
                    ))}
                  </div>

                  <p className="whatif-type-hint">{scenarioTypeInfo?.hint}</p>

                  <div className="whatif-form">
                    {draft.type !== "cancel_sub" && (
                      <>
                        <input
                          type="text"
                          placeholder="Label (optional)"
                          value={draft.label}
                          onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                          className="whatif-input"
                        />
                        <input
                          type="number"
                          placeholder={`Amount (${currencyInfo.symbol})${draft.type === "income_change" ? " — negative for loss" : ""}`}
                          value={draft.amount}
                          onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
                          className="whatif-input"
                          step="0.01"
                        />
                      </>
                    )}

                    {draft.type === "recurring" && (
                      <select
                        value={draft.frequency}
                        onChange={(e) => setDraft({ ...draft, frequency: e.target.value })}
                        className="whatif-select"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    )}

                    {draft.type === "cancel_sub" && (
                      <>
                        {scheduledPayments.length === 0 ? (
                          <p className="whatif-empty">No active subscriptions to cancel. Add some in the Transactions page first.</p>
                        ) : (
                          <select
                            value={draft.targetSubId}
                            onChange={(e) => setDraft({ ...draft, targetSubId: e.target.value })}
                            className="whatif-select"
                          >
                            <option value="">Select subscription to cancel...</option>
                            {scheduledPayments.map((sp) => (
                              <option key={sp.id} value={sp.id}>
                                {sp.name} — {formatMoney(sp.amount)} / {sp.frequency}
                              </option>
                            ))}
                          </select>
                        )}
                      </>
                    )}

                    <button
                      type="button"
                      className="whatif-submit"
                      onClick={handleAddScenario}
                      disabled={draft.type === "cancel_sub" && !draft.targetSubId}
                    >
                      Add to scenario stack
                    </button>
                  </div>
                </div>

                {/* Active scenarios list */}
                <div className="whatif-card card-soft">
                  <div className="whatif-card__header">
                    <h3 className="whatif-card__title">Active scenarios ({scenarios.length})</h3>
                    {scenarios.length > 0 && (
                      <button type="button" className="whatif-clear-btn" onClick={handleClearAll}>Clear all</button>
                    )}
                  </div>

                  {scenarios.length === 0 ? (
                    <p className="whatif-empty">Add scenarios above to see how they would change your month.</p>
                  ) : (
                    <ul className="whatif-list">
                      {scenarios.map((s) => {
                        const typeInfo = SCENARIO_TYPES.find((t) => t.id === s.type);
                        const isIncome = s.type === "income_change" && Number(s.amount) > 0;
                        const isSaving = s.type === "cancel_sub";
                        return (
                          <li key={s.id} className="whatif-list-item">
                            <span className="whatif-list-item__icon">{typeInfo?.icon}</span>
                            <div className="whatif-list-item__body">
                              <span className="whatif-list-item__label">{s.label}</span>
                              <span className="whatif-list-item__meta">
                                {typeInfo?.label}
                                {s.type === "recurring" && ` · ${s.frequency}`}
                              </span>
                            </div>
                            <span className={`whatif-list-item__amount ${isIncome || isSaving ? "whatif-amt--positive" : "whatif-amt--negative"}`}>
                              {isSaving ? "-" : ""}{formatMoney(Math.abs(s.amount))}
                            </span>
                            <button
                              type="button"
                              className="whatif-remove-btn"
                              onClick={() => handleRemoveScenario(s.id)}
                            >
                              ×
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>

              {/* ── Right column: projections ── */}
              <div className="whatif-right">
                {/* Safe to Spend */}
                <div className="whatif-card card-soft">
                  <h3 className="whatif-card__title">Safe to Spend</h3>

                  <div className="sts-grid">
                    <div className="sts-cell">
                      <span className="sts-cell__label">Today</span>
                      <span className="sts-cell__value">{formatMoney(withScenarios.safeToSpendNow, { minFractionDigits: 2, maxFractionDigits: 2 })}</span>
                      <span className="sts-cell__meta">per day</span>
                    </div>
                    <div className="sts-cell sts-cell--divider" />
                    <div className="sts-cell">
                      <span className="sts-cell__label">Projected end of month</span>
                      <span className="sts-cell__value">{formatMoney(Math.max(0, withScenarios.projectedBalance))}</span>
                      <span className="sts-cell__meta">balance on day {daysInMonth}</span>
                    </div>
                  </div>

                  {scenarios.length > 0 && (
                    <div className="sts-delta">
                      <span className="sts-delta__label">Impact of your scenarios:</span>
                      <span className={`sts-delta__value ${deltaProjected >= 0 ? "sts-delta__value--positive" : "sts-delta__value--negative"}`}>
                        {deltaProjected >= 0 ? "+" : ""}{formatMoney(deltaProjected)} to end-of-month balance
                      </span>
                    </div>
                  )}
                </div>

                {/* Before / After comparison */}
                {scenarios.length > 0 && (
                  <div className="whatif-card card-soft">
                    <h3 className="whatif-card__title">Before vs After</h3>
                    <div className="compare-grid">
                      <div className="compare-col compare-col--before">
                        <span className="compare-col__label">Without scenarios</span>
                        <div className="compare-row"><span>Current balance</span><strong>{formatMoney(baseProjection.currentBalance)}</strong></div>
                        <div className="compare-row"><span>Projected end of month</span><strong>{formatMoney(baseProjection.projectedBalance)}</strong></div>
                      </div>
                      <div className="compare-col compare-col--after">
                        <span className="compare-col__label">With scenarios</span>
                        <div className="compare-row"><span>Current balance</span><strong>{formatMoney(withScenarios.currentBalance)}</strong></div>
                        <div className="compare-row"><span>Projected end of month</span><strong>{formatMoney(withScenarios.projectedBalance)}</strong></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Warnings */}
                {warnings.length > 0 && (
                  <div className="whatif-card card-soft">
                    <h3 className="whatif-card__title">Warnings</h3>
                    <div className="warnings-list">
                      {warnings.map((w, i) => (
                        <div key={i} className={`warning-card warning-card--${w.type}`}>
                          <span className="warning-card__icon">{w.type === "danger" ? "⚠" : "!"}</span>
                          <span className="warning-card__text">{w.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Goal impact */}
                {goalImpact.length > 0 && (
                  <div className="whatif-card card-soft">
                    <h3 className="whatif-card__title">Savings goals impact</h3>
                    <p className="whatif-card__subtitle">Based on your current saving pace of {formatMoney(monthlySavingPace)}/month</p>
                    <ul className="goal-impact-list">
                      {goalImpact.map((g, i) => (
                        <li key={i} className="goal-impact-item">
                          <span className="goal-impact-item__icon">{g.icon}</span>
                          <div className="goal-impact-item__body">
                            <span className="goal-impact-item__title">{g.title}</span>
                            <span className={`goal-impact-item__delay goal-impact-item__delay--${g.delayKind}`}>
                              {g.delayText}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {scenarios.length === 0 && (
                  <div className="whatif-empty-state">
                    <div className="whatif-empty-state__icon">💭</div>
                    <h3 className="whatif-empty-state__title">No scenarios yet</h3>
                    <p className="whatif-empty-state__text">
                      Add a scenario on the left to see how it would affect your Safe to Spend, savings goals, and end-of-month balance. Stack multiple scenarios to plan combined decisions.
                    </p>
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