import { useMemo } from "react";

const computeAchievements = (transactions, income, expenses) => {
  const totalTx = transactions.length;
  const expenseTx = transactions.filter((t) => t.type === "expense");
  const uniqueDays = new Set(transactions.map((t) => new Date(t.date).toDateString())).size;
  const uniqueCategories = new Set(expenseTx.map((t) => t.category)).size;
  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

  return [
    { id: "first-tx",       icon: "⚡", title: "First Step",        description: "Add your first transaction",     unlocked: totalTx >= 1 },
    { id: "ten-tx",         icon: "🔥", title: "Getting Started",   description: "Log 10 transactions",           unlocked: totalTx >= 10, progress: Math.min(totalTx, 10), target: 10 },
    { id: "fifty-tx",       icon: "💪", title: "Committed Tracker", description: "Log 50 transactions",           unlocked: totalTx >= 50, progress: Math.min(totalTx, 50), target: 50 },
    { id: "budget-master",  icon: "🎯", title: "Budget Master",     description: "Keep expenses under 50% of income", unlocked: income > 0 && expenses / income <= 0.5 },
    { id: "saver",          icon: "🏦", title: "Super Saver",       description: "Achieve 30%+ savings rate",     unlocked: savingsRate >= 30 },
    { id: "diversified",    icon: "🗂️", title: "Diversified",       description: "Use 4+ spending categories",    unlocked: uniqueCategories >= 4, progress: Math.min(uniqueCategories, 4), target: 4 },
    { id: "streak-7",       icon: "📅", title: "Week Warrior",      description: "Log transactions on 7 different days", unlocked: uniqueDays >= 7, progress: Math.min(uniqueDays, 7), target: 7 },
    { id: "consistent",     icon: "🏆", title: "Consistent",        description: "Use the app actively",          unlocked: totalTx >= 20 && uniqueDays >= 5 },
  ];
};

export const ProfileAchievements = ({ transactions, income, expenses }) => {
  const achievements = useMemo(() => computeAchievements(transactions, income, expenses), [transactions, income, expenses]);
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="profile-achievements card-soft">
      <div className="profile-details__header">
        <h3 className="profile-details__title">Achievements</h3>
        <span className="achievements-counter">{unlockedCount}/{achievements.length}</span>
      </div>

      <div className="achievements-grid">
        {achievements.map((a) => (
          <div key={a.id} className={`achievement ${a.unlocked ? "achievement--unlocked" : ""}`}>
            <span className="achievement__icon">{a.icon}</span>
            <div className="achievement__body">
              <span className="achievement__title">{a.title}</span>
              <span className="achievement__desc">{a.description}</span>
              {!a.unlocked && a.progress !== undefined && (
                <div className="achievement__progress">
                  <div className="achievement__bar">
                    <div className="achievement__bar-fill" style={{ width: `${(a.progress / a.target) * 100}%` }} />
                  </div>
                  <span className="achievement__count">{a.progress}/{a.target}</span>
                </div>
              )}
            </div>
            {a.unlocked && <span className="achievement__check">✓</span>}
          </div>
        ))}
      </div>
    </div>
  );
};
