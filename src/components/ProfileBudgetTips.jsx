import { useMemo } from "react";
import { useSettings } from "./SettingsContext";

const generateTips = (income, expenses, transactions, formatMoney) => {
  const tips = [];
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - now.getDate();

  const expenseRatio = income > 0 ? expenses / income : 0;
  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
  const remainingBudget = Math.max(income - expenses, 0);
  const dailySafe = daysLeft > 0 ? remainingBudget / daysLeft : 0;

  const categoryTotals = {};
  transactions.filter((t) => t.type === "expense").forEach((t) => {
    const cat = t.category || "Other";
    categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(t.amount || 0);
  });
  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  if (expenseRatio > 0.8) {
    tips.push({ type: "warning", icon: "⚠️", title: "High expense ratio",
      text: `Your expenses are ${Math.round(expenseRatio * 100)}% of your income. The 50/30/20 rule suggests keeping needs under 50%.` });
  } else if (expenseRatio > 0.5) {
    tips.push({ type: "info", icon: "💡", title: "Room to optimise",
      text: `Expenses are ${Math.round(expenseRatio * 100)}% of income. Trimming even 10% could boost your savings significantly.` });
  } else if (income > 0) {
    tips.push({ type: "positive", icon: "🌟", title: "Excellent budget balance",
      text: `Only ${Math.round(expenseRatio * 100)}% of your income goes to expenses. You're following the 50/30/20 rule well — keep it up!` });
  }

  if (savingsRate >= 30) {
    tips.push({ type: "positive", icon: "🏦", title: "Strong saver",
      text: `Your ${Math.round(savingsRate)}% savings rate is above average. Most financial advisors recommend at least 20%.` });
  } else if (income > 0 && savingsRate < 10) {
    tips.push({ type: "warning", icon: "🔔", title: "Low savings rate",
      text: `Your savings rate is only ${Math.round(savingsRate)}%. Building an emergency fund of 3 months' expenses should be a priority.` });
  }

  if (sortedCategories.length > 0 && expenses > 0) {
    const [topCat, topAmount] = sortedCategories[0];
    const topPercent = Math.round((topAmount / expenses) * 100);
    if (topPercent > 40) {
      tips.push({ type: "info", icon: "🔍", title: `${topCat} dominates spending`,
        text: `${topCat} accounts for ${topPercent}% of this month's spending (${formatMoney(topAmount)}).` });
    }
  }

  if (daysLeft > 0 && income > 0) {
    tips.push({ type: "info", icon: "📊", title: "Daily spending guide",
      text: `With ${daysLeft} days left this month, try to keep daily spending under ${formatMoney(dailySafe, { minFractionDigits: 2, maxFractionDigits: 2 })}.` });
  }

  if (transactions.length === 0) {
    tips.push({ type: "info", icon: "✏️", title: "Start tracking",
      text: "Add your first transaction to unlock personalised insights." });
  }

  return tips;
};

export const ProfileBudgetTips = ({ income, expenses, transactions }) => {
  const { formatMoney } = useSettings();
  const tips = useMemo(() => generateTips(income, expenses, transactions, formatMoney), [income, expenses, transactions, formatMoney]);

  return (
    <div className="profile-tips card-soft">
      <div className="profile-details__header">
        <h3 className="profile-details__title">Budget Tips</h3>
        <span className="tips-counter">{tips.length} tip{tips.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="tips-list">
        {tips.map((tip, index) => (
          <div key={index} className={`tip-card tip-card--${tip.type}`}>
            <div className="tip-card__accent" />
            <span className="tip-card__icon">{tip.icon}</span>
            <div className="tip-card__body">
              <span className="tip-card__title">{tip.title}</span>
              <p className="tip-card__text">{tip.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
