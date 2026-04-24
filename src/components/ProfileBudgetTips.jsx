import { useMemo } from "react";
import { useSettings } from "./SettingsContext";

// ── Budget Tips logic ──
const generateTips = (income, expenses, transactions, onboardingData, formatMoney) => {
  const tips = [];
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysLeft = daysInMonth - dayOfMonth;

  const expenseTx = transactions.filter((t) => {
    const d = new Date(t.date);
    return (
      t.type === "expense" &&
      d.getMonth() === currentMonth &&
      d.getFullYear() === currentYear
    );
  });

  const monthlySpent = expenseTx.reduce(
    (sum, t) => sum + Number(t.amount || 0),
    0
  );

  const expenseRatio = income > 0 ? expenses / income : 0;
  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
  const remainingBudget = Math.max(income - expenses, 0);
  const dailySafe = daysLeft > 0 ? remainingBudget / daysLeft : 0;

  const categoryTotals = {};
  expenseTx.forEach((t) => {
    const cat = t.category || "Other";
    categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(t.amount || 0);
  });

  const sortedCategories = Object.entries(categoryTotals).sort(
    (a, b) => b[1] - a[1]
  );

  if (expenseRatio > 0.8) {
    tips.push({
      type: "warning", icon: "⚠️", title: "High expense ratio",
      text: `Your planned expenses are ${Math.round(expenseRatio * 100)}% of your income. The 50/30/20 rule suggests keeping needs under 50%. Consider reviewing fixed costs.`,
    });
  } else if (expenseRatio > 0.5 && expenseRatio <= 0.8) {
    tips.push({
      type: "info", icon: "💡", title: "Room to optimise",
      text: `Expenses are ${Math.round(expenseRatio * 100)}% of income. You're within a reasonable range, but trimming even 10% could boost your savings significantly.`,
    });
  } else if (income > 0 && expenseRatio <= 0.5) {
    tips.push({
      type: "positive", icon: "🌟", title: "Excellent budget balance",
      text: `Only ${Math.round(expenseRatio * 100)}% of your income goes to expenses. You're following the 50/30/20 rule well — keep it up!`,
    });
  }

  if (savingsRate >= 30) {
    tips.push({
      type: "positive", icon: "🏦", title: "Strong saver",
      text: `Your ${Math.round(savingsRate)}% savings rate is above average. Most financial advisors recommend at least 20%.`,
    });
  } else if (savingsRate >= 10 && savingsRate < 30) {
    tips.push({
      type: "info", icon: "📈", title: "Good start on savings",
      text: `You're saving ${Math.round(savingsRate)}% of your income. Try to increase it gradually — even 1% more each month adds up.`,
    });
  } else if (income > 0 && savingsRate < 10) {
    tips.push({
      type: "warning", icon: "🔔", title: "Low savings rate",
      text: `Your savings rate is only ${Math.round(savingsRate)}%. Building an emergency fund of 3 months' expenses should be a priority.`,
    });
  }

  if (sortedCategories.length > 0) {
    const [topCat, topAmount] = sortedCategories[0];
    const topPercent = monthlySpent > 0 ? Math.round((topAmount / monthlySpent) * 100) : 0;
    if (topPercent > 40) {
      tips.push({
        type: "info", icon: "🔍", title: `${topCat} dominates spending`,
        text: `${topCat} accounts for ${topPercent}% of this month's spending (${formatMoney(topAmount)}). Consider setting a category budget to keep it in check.`,
      });
    }
  }

  if (daysLeft > 0 && income > 0) {
    tips.push({
      type: "info", icon: "📊", title: "Daily spending guide",
      text: `With ${daysLeft} days left this month, try to keep daily spending under ${formatMoney(dailySafe, { minFractionDigits: 2, maxFractionDigits: 2 })} to stay within your budget.`,
    });
  }

  if (transactions.length === 0) {
    tips.push({
      type: "info", icon: "✏️", title: "Start tracking",
      text: "Add your first transaction to unlock personalised budget insights and track your spending patterns.",
    });
  }

  if (transactions.length > 0 && transactions.length < 5) {
    tips.push({
      type: "info", icon: "📝", title: "Keep logging",
      text: `You have ${transactions.length} transaction${transactions.length === 1 ? "" : "s"} so far. More data means better insights — try to log every purchase.`,
    });
  }

  if (income > 0 && income < 500) {
    tips.push({
      type: "info", icon: "🎓", title: "Student tip",
      text: "With a tighter budget, focus on needs first. Free student discounts, meal prepping, and off-peak travel can save a significant amount each month.",
    });
  }

  return tips;
};

export const ProfileBudgetTips = ({
  income,
  expenses,
  transactions,
  onboardingData,
}) => {
  const { formatMoney } = useSettings();

  const tips = useMemo(
    () => generateTips(income, expenses, transactions, onboardingData, formatMoney),
    [income, expenses, transactions, onboardingData, formatMoney]
  );

  return (
    <div className="profile-tips card-soft">
      <div className="profile-details__header">
        <h3 className="profile-details__title">Budget Tips</h3>
        <span className="tips-counter">
          {tips.length} tip{tips.length !== 1 ? "s" : ""}
        </span>
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