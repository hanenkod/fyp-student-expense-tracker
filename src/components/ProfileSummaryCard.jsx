import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "./SettingsContext";

const getInitials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const memberSince = () => {
  const now = new Date();
  return now.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
};

export const ProfileSummaryCard = ({
  name,
  email,
  income,
  expenses,
  balance,
}) => {
  const navigate = useNavigate();
  const { formatMoney } = useSettings();

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
    localStorage.removeItem("pockeScheduledPayments");
    localStorage.removeItem("pockeGoals");
    localStorage.removeItem("pockeAchievements");
    localStorage.removeItem("pockeCustomExpenseCategories");
    localStorage.removeItem("pockeCustomIncomeCategories");
    navigate("/registration");
  };

  return (
    <div className="profile-card card-soft">
      <div className="profile-avatar">{getInitials(name)}</div>

      <h2 className="profile-name">{name || "User"}</h2>
      <p className="profile-email">{email || "—"}</p>
      <p className="profile-member">Member since {memberSince()}</p>

      <div className="profile-stats">
        <div className="profile-stat">
          <span className="profile-stat__value">{formatMoney(income)}</span>
          <span className="profile-stat__label">Income</span>
        </div>

        <div className="profile-stat__divider" />

        <div className="profile-stat">
          <span className="profile-stat__value">{formatMoney(expenses)}</span>
          <span className="profile-stat__label">Expenses</span>
        </div>

        <div className="profile-stat__divider" />

        <div className="profile-stat">
          <span className="profile-stat__value">{formatMoney(balance)}</span>
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
              This will permanently delete your account and all data. This
              action cannot be undone.
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
  );
};