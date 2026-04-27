/**
 * Top-of-profile summary card.
 *
 * Renders the user's avatar (initials), name/email, member-since date,
 * three headline stats (income, expenses, balance), and the two
 * destructive account actions (logout, delete account) — both gated
 * by a confirmation modal.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConfirmModal } from "./ConfirmModal";
import { useSettings } from "./SettingsContext";
import { useAuth } from "./AuthContext";
import { api } from "../utils/api";

/**
 * Build a 1- or 2-letter avatar label from a full name. Falls back to
 * "?" so the avatar circle is never empty.
 */
const getInitials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Format the user's actual signup date (from the server's createdAt
 * field) as e.g. "April 2026". Falls back to the current month if the
 * field is missing — which only happens for legacy local-only users.
 */
const formatMemberSince = (createdAt) => {
  const date = createdAt ? new Date(createdAt) : new Date();
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
};

export const ProfileSummaryCard = ({
  name,
  email,
  createdAt,
  income,
  expenses,
  balance,
}) => {
  const navigate = useNavigate();
  const { formatMoney } = useSettings();
  const { logout } = useAuth();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  /**
   * Delete the account on the server, then locally clear the token
   * and navigate to registration. We always run logout/navigate even
   * if the server request fails so the user isn't trapped on a
   * broken page.
   */
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
      <p className="profile-member">Member since {formatMemberSince(createdAt)}</p>

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
        <button
          type="button"
          className="account-btn account-btn--logout"
          onClick={() => setShowLogoutConfirm(true)}
        >
          Log Out
        </button>
        <button
          type="button"
          className="account-btn account-btn--delete"
          onClick={() => setShowDeleteConfirm(true)}
        >
          Delete Account
        </button>
      </div>
    </div>
  );
};
