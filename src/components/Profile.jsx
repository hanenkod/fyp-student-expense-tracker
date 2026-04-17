import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useSettings } from "./SettingsContext";
import "../styles/style.css";
import "../styles/profile.css";

const getStoredJSON = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// ── Achievements logic ──
const computeAchievements = (transactions, onboardingData, income, expenses) => {
  const totalTx = transactions.length;
  const expenseTx = transactions.filter((t) => t.type === "expense");

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const thisMonthExpenses = expenseTx
    .filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const uniqueDays = new Set(
    transactions.map((t) => new Date(t.date).toDateString())
  ).size;

  const uniqueCategories = new Set(expenseTx.map((t) => t.category)).size;

  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

  return [
    {
      id: "first-tx",
      icon: "⚡",
      title: "First Step",
      description: "Add your first transaction",
      unlocked: totalTx >= 1,
    },
    {
      id: "ten-tx",
      icon: "🔥",
      title: "Getting Started",
      description: "Log 10 transactions",
      unlocked: totalTx >= 10,
      progress: Math.min(totalTx, 10),
      target: 10,
    },
    {
      id: "fifty-tx",
      icon: "💪",
      title: "Committed Tracker",
      description: "Log 50 transactions",
      unlocked: totalTx >= 50,
      progress: Math.min(totalTx, 50),
      target: 50,
    },
    {
      id: "budget-master",
      icon: "🎯",
      title: "Budget Master",
      description: "Keep expenses under 50% of income",
      unlocked: income > 0 && expenses / income <= 0.5,
    },
    {
      id: "saver",
      icon: "🏦",
      title: "Super Saver",
      description: "Achieve 30%+ savings rate",
      unlocked: savingsRate >= 30,
    },
    {
      id: "diversified",
      icon: "🗂️",
      title: "Diversified",
      description: "Use 4+ spending categories",
      unlocked: uniqueCategories >= 4,
      progress: Math.min(uniqueCategories, 4),
      target: 4,
    },
    {
      id: "streak-7",
      icon: "📅",
      title: "Week Warrior",
      description: "Log transactions on 7 different days",
      unlocked: uniqueDays >= 7,
      progress: Math.min(uniqueDays, 7),
      target: 7,
    },
    {
      id: "under-budget",
      icon: "🏆",
      title: "Under Budget",
      description: "Monthly spending below planned expenses",
      unlocked:
        onboardingData?.completed &&
        thisMonthExpenses < expenses &&
        thisMonthExpenses > 0,
    },
  ];
};

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

  // Category breakdown
  const categoryTotals = {};
  expenseTx.forEach((t) => {
    const cat = t.category || "Other";
    categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(t.amount || 0);
  });

  const sortedCategories = Object.entries(categoryTotals).sort(
    (a, b) => b[1] - a[1]
  );

  // Tip: High expense ratio
  if (expenseRatio > 0.8) {
    tips.push({
      type: "warning",
      icon: "⚠️",
      title: "High expense ratio",
      text: `Your planned expenses are ${Math.round(
        expenseRatio * 100
      )}% of your income. The 50/30/20 rule suggests keeping needs under 50%. Consider reviewing fixed costs.`,
    });
  } else if (expenseRatio > 0.5 && expenseRatio <= 0.8) {
    tips.push({
      type: "info",
      icon: "💡",
      title: "Room to optimise",
      text: `Expenses are ${Math.round(
        expenseRatio * 100
      )}% of income. You're within a reasonable range, but trimming even 10% could boost your savings significantly.`,
    });
  } else if (income > 0 && expenseRatio <= 0.5) {
    tips.push({
      type: "positive",
      icon: "🌟",
      title: "Excellent budget balance",
      text: `Only ${Math.round(
        expenseRatio * 100
      )}% of your income goes to expenses. You're following the 50/30/20 rule well — keep it up!`,
    });
  }

  // Tip: Savings rate
  if (savingsRate >= 30) {
    tips.push({
      type: "positive",
      icon: "🏦",
      title: "Strong saver",
      text: `Your ${Math.round(
        savingsRate
      )}% savings rate is above average. Most financial advisors recommend at least 20%.`,
    });
  } else if (savingsRate >= 10 && savingsRate < 30) {
    tips.push({
      type: "info",
      icon: "📈",
      title: "Good start on savings",
      text: `You're saving ${Math.round(
        savingsRate
      )}% of your income. Try to increase it gradually — even 1% more each month adds up.`,
    });
  } else if (income > 0 && savingsRate < 10) {
    tips.push({
      type: "warning",
      icon: "🔔",
      title: "Low savings rate",
      text: `Your savings rate is only ${Math.round(
        savingsRate
      )}%. Building an emergency fund of 3 months' expenses should be a priority.`,
    });
  }

  // Tip: Top spending category
  if (sortedCategories.length > 0) {
    const [topCat, topAmount] = sortedCategories[0];
    const topPercent =
      monthlySpent > 0 ? Math.round((topAmount / monthlySpent) * 100) : 0;

    if (topPercent > 40) {
      tips.push({
        type: "info",
        icon: "🔍",
        title: `${topCat} dominates spending`,
        text: `${topCat} accounts for ${topPercent}% of this month's spending (${formatMoney(topAmount)}). Consider setting a category budget to keep it in check.`,
      });
    }
  }

  // Tip: Daily safe to spend
  if (daysLeft > 0 && income > 0) {
    tips.push({
      type: "info",
      icon: "📊",
      title: "Daily spending guide",
      text: `With ${daysLeft} days left this month, try to keep daily spending under ${formatMoney(dailySafe, { minFractionDigits: 2, maxFractionDigits: 2 })} to stay within your budget.`,
    });
  }

  // Tip: No transactions yet
  if (transactions.length === 0) {
    tips.push({
      type: "info",
      icon: "✏️",
      title: "Start tracking",
      text: "Add your first transaction to unlock personalised budget insights and track your spending patterns.",
    });
  }

  // Tip: Not enough data
  if (transactions.length > 0 && transactions.length < 5) {
    tips.push({
      type: "info",
      icon: "📝",
      title: "Keep logging",
      text: `You have ${transactions.length} transaction${
        transactions.length === 1 ? "" : "s"
      } so far. More data means better insights — try to log every purchase.`,
    });
  }

  // Tip: Onboarding income looks low for student
  if (income > 0 && income < 500) {
    tips.push({
      type: "info",
      icon: "🎓",
      title: "Student tip",
      text: "With a tighter budget, focus on needs first. Free student discounts, meal prepping, and off-peak travel can save a significant amount each month.",
    });
  }

  return tips;
};

export const Profile = () => {
  const navigate = useNavigate();
  const { formatMoney, currencyInfo } = useSettings();
  const userData = getStoredJSON("pockeUser");
  const onboardingData = getStoredJSON("pockeOnboarding");

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: userData?.name || "",
    email: userData?.email || "",
  });
  const [errors, setErrors] = useState({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("pockeSession");
    navigate("/login");
  };

  const handleDeleteAccount = () => {
    localStorage.removeItem("pockeUser");
    localStorage.removeItem("pockeSession");
    localStorage.removeItem("pockeOnboarding");
    localStorage.removeItem("pockeTransactions");
    localStorage.removeItem("pockeGoals");
    localStorage.removeItem("pockeAchievements");
    navigate("/registration");
  };

  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => setSaveSuccess(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    return newErrors;
  };

  const handleSave = () => {
    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const updatedUser = {
      ...userData,
      name: formData.name.trim(),
      email: formData.email.trim(),
    };

    localStorage.setItem("pockeUser", JSON.stringify(updatedUser));
    setIsEditing(false);
    setErrors({});
    setSaveSuccess(true);
  };

  const handleCancel = () => {
    setFormData({
      name: userData?.name || "",
      email: userData?.email || "",
    });
    setErrors({});
    setIsEditing(false);
  };

  const income = Number(onboardingData?.income || 0);
  const expenses = Number(onboardingData?.expenses || 0);
  const balance = Math.max(income - expenses, 0);

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const memberSince = () => {
    const now = new Date();
    return now.toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
    });
  };

  // Financial summary
  const transactions = getStoredJSON("pockeTransactions") || [];

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const thisMonthTx = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const monthlySpent = thisMonthTx
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const monthlyEarned = thisMonthTx
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const thisMonthCount = thisMonthTx.length;
  const totalTransactions = transactions.length;

  const savingsRate =
    income > 0 ? Math.round(((income - expenses) / income) * 100) : 0;

  // Budget pace
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const monthProgress = Math.round((dayOfMonth / daysInMonth) * 100);
  const budgetUsed = income > 0 ? Math.round((expenses / income) * 100) : 0;

  let budgetPace = "on-track";
  let budgetPaceLabel = "On track";
  if (budgetUsed > monthProgress + 15) {
    budgetPace = "overspending";
    budgetPaceLabel = "Overspending";
  } else if (budgetUsed < monthProgress - 15) {
    budgetPace = "under-budget";
    budgetPaceLabel = "Under budget";
  }

  // Achievements
  const achievements = useMemo(
    () => computeAchievements(transactions, onboardingData, income, expenses),
    [transactions, onboardingData, income, expenses]
  );

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  // Budget tips
  const tips = useMemo(
    () => generateTips(income, expenses, transactions, onboardingData, formatMoney),
    [income, expenses, transactions, onboardingData, formatMoney]
  );

  return (
    <div className="dashboard">
      <div className="app-shell">
        <div className="layout">
          <Sidebar />

          <main className="content">
            <header className="overview card card-soft card-overview">
              <div className="overview-bar">
                <div className="overview-text stack-5">
                  <h1 className="overview-title">Profile</h1>
                  <p className="overview-subtitle">
                    Manage your personal information
                  </p>
                </div>
              </div>
            </header>

            <div className="profile-layout">
              {/* ── Left column ── */}
              <div className="profile-left-col">
                <div className="profile-card card-soft">
                  <div className="profile-avatar">
                    {getInitials(formData.name)}
                  </div>

                  <h2 className="profile-name">{formData.name || "User"}</h2>
                  <p className="profile-email">{formData.email || "—"}</p>
                  <p className="profile-member">Member since {memberSince()}</p>

                  <div className="profile-stats">
                    <div className="profile-stat">
                      <span className="profile-stat__value">
                        {formatMoney(income)}
                      </span>
                      <span className="profile-stat__label">Income</span>
                    </div>

                    <div className="profile-stat__divider" />

                    <div className="profile-stat">
                      <span className="profile-stat__value">
                        {formatMoney(expenses)}
                      </span>
                      <span className="profile-stat__label">Expenses</span>
                    </div>

                    <div className="profile-stat__divider" />

                    <div className="profile-stat">
                      <span className="profile-stat__value">
                        {formatMoney(balance)}
                      </span>
                      <span className="profile-stat__label">Balance</span>
                    </div>
                  </div>

                  <div className="profile-account-btns">
                    <button
                      type="button"
                      className="account-btn account-btn--logout"
                      onClick={handleLogout}
                    >
                      Log Out
                    </button>

                    {!showDeleteConfirm ? (
                      <button
                        type="button"
                        className="account-btn account-btn--delete"
                        onClick={() => setShowDeleteConfirm(true)}
                      >
                        Delete Account
                      </button>
                    ) : (
                      <div className="delete-confirm">
                        <p className="delete-confirm__text">
                          This will permanently delete your account and all
                          data. This action cannot be undone.
                        </p>
                        <div className="delete-confirm__actions">
                          <button
                            type="button"
                            className="profile-btn profile-btn--cancel"
                            onClick={() => setShowDeleteConfirm(false)}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="account-btn account-btn--confirm-delete"
                            onClick={handleDeleteAccount}
                          >
                            Yes, Delete Everything
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Achievements ── */}
                <div className="profile-achievements card-soft">
                  <div className="profile-details__header">
                    <h3 className="profile-details__title">Achievements</h3>
                    <span className="achievements-counter">
                      {unlockedCount}/{achievements.length}
                    </span>
                  </div>

                  <div className="achievements-grid">
                    {achievements.map((a) => (
                      <div
                        key={a.id}
                        className={`achievement ${
                          a.unlocked ? "achievement--unlocked" : ""
                        }`}
                      >
                        <span className="achievement__icon">{a.icon}</span>
                        <div className="achievement__body">
                          <span className="achievement__title">{a.title}</span>
                          <span className="achievement__desc">
                            {a.description}
                          </span>
                          {!a.unlocked && a.progress !== undefined && (
                            <div className="achievement__progress">
                              <div className="achievement__bar">
                                <div
                                  className="achievement__bar-fill"
                                  style={{
                                    width: `${(a.progress / a.target) * 100}%`,
                                  }}
                                />
                              </div>
                              <span className="achievement__count">
                                {a.progress}/{a.target}
                              </span>
                            </div>
                          )}
                        </div>
                        {a.unlocked && (
                          <span className="achievement__check">✓</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Right column ── */}
              <div className="profile-right-col">
                <div className="profile-details card-soft">
                  <div className="profile-details__header">
                    <h3 className="profile-details__title">
                      Personal Information
                    </h3>

                    {!isEditing ? (
                      <button
                        type="button"
                        className="profile-btn profile-btn--edit"
                        onClick={() => setIsEditing(true)}
                      >
                        Edit
                      </button>
                    ) : (
                      <div className="profile-details__actions">
                        <button
                          type="button"
                          className="profile-btn profile-btn--cancel"
                          onClick={handleCancel}
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          className="profile-btn profile-btn--save"
                          onClick={handleSave}
                        >
                          Save
                        </button>
                      </div>
                    )}
                  </div>

                  {saveSuccess && (
                    <div className="profile-toast">
                      Profile updated successfully
                    </div>
                  )}

                  <div className="profile-fields">
                    <div className="profile-field">
                      <label className="profile-field__label">Full Name</label>
                      {isEditing ? (
                        <>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={`profile-field__input ${
                              errors.name ? "profile-field__input--error" : ""
                            }`}
                            placeholder="Your Name"
                          />
                          {errors.name && (
                            <p className="profile-field__error">
                              {errors.name}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="profile-field__value">
                          {formData.name || "—"}
                        </p>
                      )}
                    </div>

                    <div className="profile-field">
                      <label className="profile-field__label">
                        Email Address
                      </label>
                      {isEditing ? (
                        <>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={`profile-field__input ${
                              errors.email ? "profile-field__input--error" : ""
                            }`}
                            placeholder="Your Email"
                          />
                          {errors.email && (
                            <p className="profile-field__error">
                              {errors.email}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="profile-field__value">
                          {formData.email || "—"}
                        </p>
                      )}
                    </div>

                    <div className="profile-field">
                      <label className="profile-field__label">
                        Monthly Income
                      </label>
                      <p className="profile-field__value">
                        {formatMoney(income)}
                      </p>
                    </div>

                    <div className="profile-field">
                      <label className="profile-field__label">
                        Monthly Expenses
                      </label>
                      <p className="profile-field__value">
                        {formatMoney(expenses)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── Budget Tips ── */}
                <div className="profile-tips card-soft">
                  <div className="profile-details__header">
                    <h3 className="profile-details__title">Budget Tips</h3>
                    <span className="tips-counter">
                      {tips.length} tip{tips.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="tips-list">
                    {tips.map((tip, index) => (
                      <div
                        key={index}
                        className={`tip-card tip-card--${tip.type}`}
                      >
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

                {/* ── Financial Summary ── */}
                <div className="profile-summary card-soft">
                  <h3 className="profile-details__title">Financial Summary</h3>

                  <div className="summary-grid">
                    <div className="summary-tile">
                      <span className="summary-tile__icon summary-tile__icon--green">
                        {currencyInfo.symbol}
                      </span>
                      <div className="summary-tile__body">
                        <span className="summary-tile__value">
                          {formatMoney(monthlyEarned)}
                        </span>
                        <span className="summary-tile__label">
                          Earned this month
                        </span>
                      </div>
                    </div>

                    <div className="summary-tile">
                      <span className="summary-tile__icon summary-tile__icon--red">
                        {currencyInfo.symbol}
                      </span>
                      <div className="summary-tile__body">
                        <span className="summary-tile__value">
                          {formatMoney(monthlySpent)}
                        </span>
                        <span className="summary-tile__label">
                          Spent this month
                        </span>
                      </div>
                    </div>

                    <div className="summary-tile">
                      <span className="summary-tile__icon summary-tile__icon--purple">
                        %
                      </span>
                      <div className="summary-tile__body">
                        <span className="summary-tile__value">
                          {savingsRate}%
                        </span>
                        <span className="summary-tile__label">
                          Savings rate
                        </span>
                      </div>
                    </div>

                    <div className="summary-tile">
                      <span className="summary-tile__icon summary-tile__icon--blue">
                        #
                      </span>
                      <div className="summary-tile__body">
                        <span className="summary-tile__value">
                          {thisMonthCount}
                        </span>
                        <span className="summary-tile__label">
                          Transactions this month
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="summary-bar-section">
                    <div className="summary-bar-header">
                      <span className="summary-bar-label">
                        Monthly budget progress
                      </span>
                      <span className="summary-bar-percent">{budgetUsed}%</span>
                    </div>
                    <div className="summary-bar">
                      <div
                        className={`summary-bar__fill summary-bar__fill--${budgetPace}`}
                        style={{ width: `${Math.min(budgetUsed, 100)}%` }}
                      />
                      <div
                        className="summary-bar__marker"
                        style={{ left: `${monthProgress}%` }}
                      />
                    </div>
                    <div className="summary-bar-legend">
                      <span>
                        Day {dayOfMonth} of {daysInMonth}
                      </span>
                      <span className="summary-bar-legend__marker">
                        ▲ Today
                      </span>
                    </div>
                  </div>

                  {totalTransactions === 0 && (
                    <p className="summary-empty">
                      Start adding transactions to see your financial insights
                      here.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};