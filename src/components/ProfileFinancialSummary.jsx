import { useSettings } from "./SettingsContext";

export const ProfileFinancialSummary = ({
  income,
  expenses,
  monthlyEarned,
  monthlySpent,
  thisMonthCount,
  totalTransactions,
}) => {
  const { formatMoney, currencyInfo } = useSettings();

  const savingsRate = income > 0 ? Math.round(((income - expenses) / income) * 100) : 0;
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const monthProgress = Math.round((dayOfMonth / daysInMonth) * 100);
  const budgetUsed = income > 0 ? Math.round((expenses / income) * 100) : 0;

  let budgetPace = "on-track";
  if (budgetUsed > monthProgress + 15) budgetPace = "overspending";
  else if (budgetUsed < monthProgress - 15) budgetPace = "under-budget";

  const totalFlow = monthlyEarned + monthlySpent;
  const earnedPct = totalFlow > 0 ? (monthlyEarned / totalFlow) * 100 : 0;
  const spentPct = 100 - earnedPct;
  const netFlow = monthlyEarned - monthlySpent;

  return (
    <div className="profile-summary card-soft">
      <h3 className="profile-details__title">Financial Summary</h3>

      <div className="summary-grid">
        <div className="summary-tile">
          <span className="summary-tile__icon summary-tile__icon--green">{currencyInfo.symbol}</span>
          <div className="summary-tile__body">
            <span className="summary-tile__value">{formatMoney(monthlyEarned)}</span>
            <span className="summary-tile__label">Earned this month</span>
          </div>
        </div>

        <div className="summary-tile">
          <span className="summary-tile__icon summary-tile__icon--red">{currencyInfo.symbol}</span>
          <div className="summary-tile__body">
            <span className="summary-tile__value">{formatMoney(monthlySpent)}</span>
            <span className="summary-tile__label">Spent this month</span>
          </div>
        </div>

        <div className="summary-tile">
          <span className="summary-tile__icon summary-tile__icon--purple">%</span>
          <div className="summary-tile__body">
            <span className="summary-tile__value">{savingsRate}%</span>
            <span className="summary-tile__label">Savings rate</span>
          </div>
        </div>

        <div className="summary-tile">
          <span className="summary-tile__icon summary-tile__icon--blue">#</span>
          <div className="summary-tile__body">
            <span className="summary-tile__value">{thisMonthCount}</span>
            <span className="summary-tile__label">Transactions this month</span>
          </div>
        </div>
      </div>

      {(monthlyEarned > 0 || monthlySpent > 0) && (
        <div className="flow-section">
          <div className="flow-header">
            <span className="flow-label">Income vs Spending</span>
            <span className={`flow-net ${netFlow >= 0 ? "flow-net--positive" : "flow-net--negative"}`}>
              {netFlow >= 0 ? "+" : "-"}{formatMoney(Math.abs(netFlow))} net
            </span>
          </div>
          <div className="flow-bar">
            {monthlyEarned > 0 && <div className="flow-bar__segment flow-bar__segment--earned" style={{ width: `${earnedPct}%` }} />}
            {monthlySpent > 0 && <div className="flow-bar__segment flow-bar__segment--spent" style={{ width: `${spentPct}%` }} />}
          </div>
          <div className="flow-legend">
            <div className="flow-legend-item">
              <span className="flow-legend-dot flow-legend-dot--earned" />
              <span className="flow-legend-text"><strong>{formatMoney(monthlyEarned)}</strong> earned</span>
            </div>
            <div className="flow-legend-item">
              <span className="flow-legend-dot flow-legend-dot--spent" />
              <span className="flow-legend-text"><strong>{formatMoney(monthlySpent)}</strong> spent</span>
            </div>
          </div>
        </div>
      )}

      <div className="summary-bar-section">
        <div className="summary-bar-header">
          <span className="summary-bar-label">Monthly budget progress</span>
          <span className="summary-bar-percent">{budgetUsed}%</span>
        </div>
        <div className="summary-bar">
          <div className={`summary-bar__fill summary-bar__fill--${budgetPace}`} style={{ width: `${Math.min(budgetUsed, 100)}%` }} />
          <div className="summary-bar__marker" style={{ left: `${monthProgress}%` }} />
        </div>
        <div className="summary-bar-legend">
          <span>Day {dayOfMonth} of {daysInMonth}</span>
          <span className="summary-bar-legend__marker">▲ Today</span>
        </div>
      </div>

      {totalTransactions === 0 && (
        <p className="summary-empty">Start adding transactions to see your financial insights here.</p>
      )}
    </div>
  );
};
