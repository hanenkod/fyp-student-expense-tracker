import { useState } from "react";
import { useSettings } from "./SettingsContext";
import { useToast } from "./ToastContext";
import { useAuth } from "./AuthContext";
import { api } from "../utils/api";

export const ProfilePersonalInfo = () => {
  const { formatMoney, currencyInfo } = useSettings();
  const { showToast } = useToast();
  const { user, setUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    income: String(user?.income || ""),
  });
  const [errors, setErrors] = useState({});

  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" });
  const [passwordErrors, setPasswordErrors] = useState({});

  const handleChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
    setErrors((p) => ({ ...p, [e.target.name]: "" }));
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = "Name is required";
    if (!formData.email.trim()) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = "Invalid email format";
    return errs;
  };

  const handleSave = async () => {
    const errs = validateForm();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    try {
      const updated = await api.updateMe({
        name: formData.name.trim(),
        email: formData.email.trim(),
        income: Number(formData.income) || 0,
      });
      setUser(updated);
      setIsEditing(false);
      showToast("Profile updated", { type: "success" });
    } catch (err) {
      if (err?.status === 409) setErrors({ email: "Email already taken" });
      else showToast(err?.body?.error || "Could not save", { type: "error" });
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      income: String(user?.income || ""),
    });
    setErrors({});
    setIsEditing(false);
  };

  const handleChangePassword = async () => {
    const errs = {};
    if (!passwordForm.current) errs.current = "Current password is required";
    if (!passwordForm.new) errs.new = "New password is required";
    else if (passwordForm.new.length < 6) errs.new = "Must be at least 6 characters";
    if (passwordForm.new !== passwordForm.confirm) errs.confirm = "Passwords do not match";

    if (Object.keys(errs).length > 0) {
      setPasswordErrors(errs);
      return;
    }

    try {
      await api.changePassword(passwordForm.current, passwordForm.new);
      setPasswordForm({ current: "", new: "", confirm: "" });
      setPasswordErrors({});
      setShowPasswordChange(false);
      showToast("Password changed", { type: "success" });
    } catch (err) {
      if (err?.status === 401) setPasswordErrors({ current: "Current password is incorrect" });
      else showToast(err?.body?.error || "Could not change password", { type: "error" });
    }
  };

  const handleCancelPassword = () => {
    setPasswordForm({ current: "", new: "", confirm: "" });
    setPasswordErrors({});
    setShowPasswordChange(false);
  };

  return (
    <div className="profile-details card-soft">
      <div className="profile-details__header">
        <h3 className="profile-details__title">Personal Information</h3>
        {!isEditing ? (
          <button type="button" className="profile-btn profile-btn--edit" onClick={() => setIsEditing(true)}>Edit</button>
        ) : (
          <div className="profile-details__actions">
            <button type="button" className="profile-btn profile-btn--cancel" onClick={handleCancel}>Cancel</button>
            <button type="button" className="profile-btn profile-btn--save" onClick={handleSave}>Save</button>
          </div>
        )}
      </div>

      <div className="profile-fields">
        <div className="profile-field">
          <label className="profile-field__label">Full Name</label>
          {isEditing ? (
            <>
              <input type="text" name="name" value={formData.name} onChange={handleChange}
                className={`profile-field__input ${errors.name ? "profile-field__input--error" : ""}`} />
              {errors.name && <p className="profile-field__error">{errors.name}</p>}
            </>
          ) : <p className="profile-field__value">{formData.name || "—"}</p>}
        </div>

        <div className="profile-field">
          <label className="profile-field__label">Email Address</label>
          {isEditing ? (
            <>
              <input type="email" name="email" value={formData.email} onChange={handleChange}
                className={`profile-field__input ${errors.email ? "profile-field__input--error" : ""}`} />
              {errors.email && <p className="profile-field__error">{errors.email}</p>}
            </>
          ) : <p className="profile-field__value">{formData.email || "—"}</p>}
        </div>

        <div className="profile-field">
          <label className="profile-field__label">Monthly Income</label>
          {isEditing ? (
            <div className="profile-field__input-wrap">
              <span className="profile-field__prefix" aria-hidden="true">{currencyInfo.symbol}</span>
              <input type="number" name="income" value={formData.income} onChange={handleChange}
                className="profile-field__input profile-field__input--with-prefix" min="0" step="0.01" placeholder="0" />
            </div>
          ) : <p className="profile-field__value">{formatMoney(Math.round(Number(formData.income) || 0))}</p>}
        </div>
      </div>

      <div className="profile-password">
        {!showPasswordChange ? (
          <button type="button" className="profile-password__toggle-btn" onClick={() => setShowPasswordChange(true)}>
            Change password
          </button>
        ) : (
          <div className="profile-password__form">
            <h4 className="profile-password__title">Change password</h4>

            <div className="profile-field">
              <label className="profile-field__label">Current password</label>
              <input type="password" value={passwordForm.current}
                onChange={(e) => setPasswordForm((p) => ({ ...p, current: e.target.value }))}
                className={`profile-field__input ${passwordErrors.current ? "profile-field__input--error" : ""}`}
                autoComplete="current-password" />
              {passwordErrors.current && <p className="profile-field__error">{passwordErrors.current}</p>}
            </div>

            <div className="profile-field">
              <label className="profile-field__label">New password</label>
              <input type="password" value={passwordForm.new}
                onChange={(e) => setPasswordForm((p) => ({ ...p, new: e.target.value }))}
                className={`profile-field__input ${passwordErrors.new ? "profile-field__input--error" : ""}`}
                autoComplete="new-password" />
              {passwordErrors.new && <p className="profile-field__error">{passwordErrors.new}</p>}
            </div>

            <div className="profile-field">
              <label className="profile-field__label">Confirm new password</label>
              <input type="password" value={passwordForm.confirm}
                onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))}
                className={`profile-field__input ${passwordErrors.confirm ? "profile-field__input--error" : ""}`}
                autoComplete="new-password" />
              {passwordErrors.confirm && <p className="profile-field__error">{passwordErrors.confirm}</p>}
            </div>

            <div className="profile-password__actions">
              <button type="button" className="profile-password__btn profile-password__btn--save" onClick={handleChangePassword}>
                Update password
              </button>
              <button type="button" className="profile-password__btn profile-password__btn--cancel" onClick={handleCancelPassword}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
