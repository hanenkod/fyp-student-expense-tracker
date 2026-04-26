import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConfirmModal } from "./ConfirmModal";
import { useSettings } from "./SettingsContext";
import { useAuth } from "./AuthContext";
import { api } from "../utils/api";

const getInitials = (name) => {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
};

const memberSince = () => new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });

export const ProfileSummaryCard = ({ name, email, income, expenses, balance }) => {
  const navigate = useNavigate();
  const { formatMoney } = useSettings();
  const { logout } = useAuth();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleDeleteAccount = async () => {
    try {
      await api.deleteMe();
    } catch (err) {
      console.error("Delete account failed:", err);
    }
    logout();
    navigate("/registration");
  };

  return (
    <div className="profile-card card-soft">
      <ConfirmModal
        open={showLogoutConfirm}
        title="Log out?"
        message="You'll need to sign in again to access your data."
        confirmLabel="Log out"
        confirmKind="primary"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
      <ConfirmModal
        open={showDeleteConfirm}
        title="Delete account permanently?"
        message="All your transactions, goals, subscriptions and settings will be erased. This cannot be undone."
        confirmLabel="Delete everything"
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <div className="profile-avatar">{getInitials(name)}</div>
      <h2 className="profile-name">{name || "User"}</h2>
      <p className="profile-email">{email || "—"}</p>
      <p className="profile-member">Member since {memberSince()}</p>

      <div className="profile-stats">
        <div className="profile-stat">
          <span className="profile-stat__value">{formatMoney(Math.round(income))}</span>
          <span className="profile-stat__label">Income</span>
        </div>
        <div className="profile-stat__divider" />
        <div className="profile-stat">
          <span className="profile-stat__value">{formatMoney(Math.round(expenses))}</span>
          <span className="profile-stat__label">Expenses</span>
        </div>
        <div className="profile-stat__divider" />
        <div className="profile-stat">
          <span className="profile-stat__value">{formatMoney(Math.round(balance))}</span>
          <span className="profile-stat__label">Balance</span>
        </div>
      </div>

      <div className="profile-account-btns">
        <button type="button" className="account-btn account-btn--logout" onClick={() => setShowLogoutConfirm(true)}>
          Log Out
        </button>
        <button type="button" className="account-btn account-btn--delete" onClick={() => setShowDeleteConfirm(true)}>
          Delete Account
        </button>
      </div>
    </div>
  );
};
