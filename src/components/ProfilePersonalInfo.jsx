import { useState, useEffect } from "react";
import { useSettings } from "./SettingsContext";
import { useToast } from "./ToastContext";

export const ProfilePersonalInfo = ({ userData, onboardingData, income }) => {
  const { formatMoney } = useSettings();
  const { showToast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: userData?.name || "",
    email: userData?.email || "",
    income: String(onboardingData?.income || ""),
  });
  const [errors, setErrors] = useState({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({});

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
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Invalid email format";
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

    const newIncome = Number(formData.income);
    if (Number.isFinite(newIncome) && newIncome >= 0) {
      const updatedOnboarding = { ...(onboardingData || {}), income: newIncome };
      localStorage.setItem("pockeOnboarding", JSON.stringify(updatedOnboarding));
    }

    setIsEditing(false);
    setErrors({});
    setSaveSuccess(true);
    showToast("Profile updated", { type: "success" });
  };

  const handleCancel = () => {
    setFormData({
      name: userData?.name || "",
      email: userData?.email || "",
      income: String(onboardingData?.income || ""),
    });
    setErrors({});
    setIsEditing(false);
  };

  // Password change handlers
  const validatePassword = () => {
    const errs = {};
    if (!passwordForm.current) errs.current = "Current password is required";
    else if (userData?.password && passwordForm.current !== userData.password) {
      errs.current = "Current password is incorrect";
    }
    if (!passwordForm.new) errs.new = "New password is required";
    else if (passwordForm.new.length < 6)
      errs.new = "Must be at least 6 characters";
    if (passwordForm.new !== passwordForm.confirm) {
      errs.confirm = "Passwords do not match";
    }
    return errs;
  };

  const handleChangePassword = () => {
    const errs = validatePassword();
    if (Object.keys(errs).length > 0) {
      setPasswordErrors(errs);
      return;
    }
    const updatedUser = { ...userData, password: passwordForm.new };
    localStorage.setItem("pockeUser", JSON.stringify(updatedUser));
    setPasswordForm({ current: "", new: "", confirm: "" });
    setPasswordErrors({});
    setShowPasswordChange(false);
    showToast("Password changed", { type: "success" });
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
        <div className="profile-toast">Profile updated successfully</div>
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
                <p className="profile-field__error">{errors.name}</p>
              )}
            </>
          ) : (
            <p className="profile-field__value">{formData.name || "—"}</p>
          )}
        </div>

        <div className="profile-field">
          <label className="profile-field__label">Email Address</label>
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
                <p className="profile-field__error">{errors.email}</p>
              )}
            </>
          ) : (
            <p className="profile-field__value">{formData.email || "—"}</p>
          )}
        </div>

        <div className="profile-field">
          <label className="profile-field__label">Monthly Income</label>
          {isEditing ? (
            <input
              type="number"
              name="income"
              value={formData.income}
              onChange={handleChange}
              className="profile-field__input"
              min="0"
              step="0.01"
              placeholder="0"
            />
          ) : (
            <p className="profile-field__value">{formatMoney(income)}</p>
          )}
        </div>
      </div>

      {/* Password change */}
      <div className="profile-password">
        {!showPasswordChange ? (
          <button
            type="button"
            className="profile-password__toggle-btn"
            onClick={() => setShowPasswordChange(true)}
          >
            Change password
          </button>
        ) : (
          <div className="profile-password__form">
            <h4 className="profile-password__title">Change password</h4>

            <div className="profile-field">
              <label className="profile-field__label">Current password</label>
              <input
                type="password"
                value={passwordForm.current}
                onChange={(e) =>
                  setPasswordForm((p) => ({ ...p, current: e.target.value }))
                }
                className={`profile-field__input ${
                  passwordErrors.current ? "profile-field__input--error" : ""
                }`}
                autoComplete="current-password"
              />
              {passwordErrors.current && (
                <p className="profile-field__error">{passwordErrors.current}</p>
              )}
            </div>

            <div className="profile-field">
              <label className="profile-field__label">New password</label>
              <input
                type="password"
                value={passwordForm.new}
                onChange={(e) =>
                  setPasswordForm((p) => ({ ...p, new: e.target.value }))
                }
                className={`profile-field__input ${
                  passwordErrors.new ? "profile-field__input--error" : ""
                }`}
                autoComplete="new-password"
              />
              {passwordErrors.new && (
                <p className="profile-field__error">{passwordErrors.new}</p>
              )}
            </div>

            <div className="profile-field">
              <label className="profile-field__label">
                Confirm new password
              </label>
              <input
                type="password"
                value={passwordForm.confirm}
                onChange={(e) =>
                  setPasswordForm((p) => ({ ...p, confirm: e.target.value }))
                }
                className={`profile-field__input ${
                  passwordErrors.confirm ? "profile-field__input--error" : ""
                }`}
                autoComplete="new-password"
              />
              {passwordErrors.confirm && (
                <p className="profile-field__error">{passwordErrors.confirm}</p>
              )}
            </div>

            <div className="profile-password__actions">
              <button
                type="button"
                className="profile-password__btn profile-password__btn--save"
                onClick={handleChangePassword}
              >
                Update password
              </button>
              <button
                type="button"
                className="profile-password__btn profile-password__btn--cancel"
                onClick={handleCancelPassword}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};