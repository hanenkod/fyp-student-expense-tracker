import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BiApple } from "./BiApple";
import { DeviconGoogle } from "./DeviconGoogle";
import removebg1 from "./removebg-1.png";
import "../styles/auth.css";

const initialForm = {
  name: "",
  email: "",
  password: "",
};

export const Registration = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Enter your name";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Enter your email";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Enter password";
    } else if (formData.password.length < 6) {
      newErrors.password = "Min 6 characters";
    }

    return newErrors;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const existingUser = (() => {
      try {
        const raw = localStorage.getItem("pockeUser");
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    })();

    if (
      existingUser &&
      existingUser.email.toLowerCase() === formData.email.trim().toLowerCase()
    ) {
      setErrors({ email: "An account with this email already exists" });
      return;
    }

    localStorage.setItem(
      "pockeUser",
      JSON.stringify({
        ...formData,
        email: formData.email.trim(),
      })
    );

    setFormData(initialForm);
    setErrors({});
    setShowPassword(false);

    localStorage.removeItem("pockeOnboarding");
    localStorage.setItem("pockeSession", JSON.stringify({ isLoggedIn: true }));

    navigate("/onboarding");
  };

  return (
    <section className="registration page-shell authScreen authScreen--animated">
      <div className="registration__shell app-shell">
        <aside className="registration__sidebar">
          <div className="registration__sidebarContent">
            <div className="registration__artwork">
              <div className="registration__artworkGlow" />
              <img
                className="registration__image"
                src={removebg1}
                alt="POCKE abstract illustration"
              />
            </div>

            <div className="registration__brandBlock">
              <h2 className="registration__logo registration__logo--light">
                POCKE
              </h2>

              <p className="registration__tagline">
                Know what you can spend today.
                <br />
                Track. Save. Stay in control.
              </p>
            </div>
          </div>
        </aside>

        <main className="registration__content app-panel">
          <div className="registration__contentInner">
            <div className="registration__header">
              <div className="registration__logo registration__logo--dark">
                POCKE
              </div>

              <h1 className="registration__title">
                Create Your Free Account
              </h1>
            </div>

            <div className="registration__socials">
              <button type="button" className="registration__socialButton">
                <DeviconGoogle className="registration__socialIcon" />
                <span>Sign Up with Google</span>
              </button>

              <button type="button" className="registration__socialButton">
                <BiApple className="registration__socialIcon" />
                <span>Sign Up with Apple</span>
              </button>
            </div>

            <div className="registration__divider">
              <span className="registration__dividerLine" />
              <span className="registration__dividerText">OR</span>
              <span className="registration__dividerLine" />
            </div>

            <form className="registration__form" onSubmit={handleSubmit}>
              <div className="registration__field">
                <label className="registration__label" htmlFor="name">
                  Name
                </label>

                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="registration__input"
                  placeholder="Your Name"
                />

                {errors.name && (
                  <p className="registration__error">{errors.name}</p>
                )}
              </div>

              <div className="registration__field">
                <label className="registration__label" htmlFor="email">
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="registration__input"
                  placeholder="Your Email"
                />

                {errors.email && (
                  <p className="registration__error">{errors.email}</p>
                )}
              </div>

              <div className="registration__field">
                <label className="registration__label" htmlFor="password">
                  Password
                </label>

                <div className="registration__passwordWrapper">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="registration__input registration__input--password"
                    placeholder="Password"
                  />

                  <button
                    type="button"
                    className="registration__passwordToggle"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>

                {errors.password && (
                  <p className="registration__error">{errors.password}</p>
                )}
              </div>

              <button type="submit" className="registration__submit app-button">
                Sign Up
              </button>
            </form>

            <p className="registration__footer">
              <span className="registration__footerText">
                Already have an account?
              </span>{" "}
              <Link to="/login" className="registration__footerLink">
                Sign In
              </Link>
            </p>
          </div>
        </main>
      </div>
    </section>
  );
};
