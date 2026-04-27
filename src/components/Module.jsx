/**
 * Module — generic onboarding step card.
 *
 * Reusable layout used by both onboarding steps: title + description,
 * an optional input, and a Next button. Each step controls its own
 * value/onChange/onNext via props.
 */
import "../styles/module.css";

export const Module = ({
  title,
  description,
  label,
  placeholder,
  buttonText,
  step,
  value,
  onChange,
  onNext,
  showInput = true,
  isNextDisabled = false,
}) => {
  return (
    <div className="onboardingModule onboardingModule--animated">
      <h1 className="onboardingModule__title">{title}</h1>

      <p className="onboardingModule__description">{description}</p>

      {showInput && (
        <div className="onboardingModule__field">
          <label className="onboardingModule__label">{label}</label>

          <input
            type="text"
            value={value}
            onChange={onChange}
            className="onboardingModule__input"
            placeholder={placeholder}
            inputMode="decimal"
          />
        </div>
      )}

      <button
        type="button"
        className="onboardingModule__button"
        onClick={onNext}
        disabled={isNextDisabled}
      >
        {buttonText}
      </button>

      <div className="onboardingModule__step">{step}</div>
    </div>
  );
};