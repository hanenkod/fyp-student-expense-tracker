import { useState } from "react";
import { useSettings } from "./SettingsContext";
import { useToast } from "./ToastContext";
import { saveJSON, STORAGE_KEYS } from "../utils/storage";

const PRESET_SERVICES = [
  { name: "Spotify", amount: 10.99 },
  { name: "Netflix", amount: 15.99 },
  { name: "YouTube Premium", amount: 13.99 },
  { name: "Apple Music", amount: 10.99 },
  { name: "Amazon Prime", amount: 8.99 },
  { name: "Disney+", amount: 7.99 },
  { name: "Pure Gym", amount: 32.99 },
  { name: "iCloud+", amount: 2.99 },
];

export const AddScheduledPaymentForm = ({ scheduled, onScheduledChange }) => {
  const { currencyInfo } = useSettings();
  const { showToast } = useToast();

  const [spForm, setSpForm] = useState({
    preset: "",
    name: "",
    amount: "",
    frequency: "monthly",
    startDate: new Date().toISOString().split("T")[0],
  });
  const [showCustomService, setShowCustomService] = useState(false);

  const handlePresetSelect = (preset) => {
    if (preset === "__custom") {
      setShowCustomService(true);
      setSpForm((p) => ({ ...p, preset: "", name: "", amount: "" }));
    } else {
      const service = PRESET_SERVICES.find((s) => s.name === preset);
      if (service) {
        setShowCustomService(false);
        setSpForm((p) => ({ ...p, preset, name: service.name, amount: String(service.amount) }));
      }
    }
  };

  const handleAdd = () => {
    if (!spForm.name.trim()) {
      showToast("Please select or enter a service name", { type: "error" });
      return;
    }
    if (!spForm.amount || Number(spForm.amount) <= 0) {
      showToast("Amount must be greater than zero", { type: "error" });
      return;
    }
    const newSub = {
      id: `sp_${Date.now()}`,
      name: spForm.name.trim(),
      amount: Number(spForm.amount),
      frequency: spForm.frequency,
      startDate: spForm.startDate,
    };
    const updated = [...scheduled, newSub];
    onScheduledChange(updated);
    saveJSON(STORAGE_KEYS.SCHEDULED, updated);

    setSpForm({
      preset: "",
      name: "",
      amount: "",
      frequency: "monthly",
      startDate: new Date().toISOString().split("T")[0],
    });
    setShowCustomService(false);
    showToast(`Subscription added: ${newSub.name}`, { type: "success" });
  };

  return (
    <div className="tx-card card-soft">
      <h3 className="tx-card__title">Add Scheduled Payment</h3>
      <div className="tx-form">
        <select
          value={showCustomService ? "__custom" : spForm.preset}
          onChange={(e) => handlePresetSelect(e.target.value)}
          className="tx-select"
          aria-label="Subscription service"
        >
          <option value="">Select a service...</option>
          {PRESET_SERVICES.map((s) => (
            <option key={s.name} value={s.name}>
              {s.name} — {currencyInfo.symbol}{s.amount}
            </option>
          ))}
          <option value="__custom">+ Custom service</option>
        </select>

        {showCustomService && (
          <input
            type="text"
            placeholder="Service name"
            value={spForm.name}
            onChange={(e) => setSpForm((p) => ({ ...p, name: e.target.value }))}
            className="tx-input"
            aria-label="Service name"
          />
        )}

        <div className="tx-amount-wrap">
          <span className="tx-amount-symbol" aria-hidden="true">{currencyInfo.symbol}</span>
          <input
            type="number"
            placeholder="0.00"
            value={spForm.amount}
            onChange={(e) => setSpForm((p) => ({ ...p, amount: e.target.value }))}
            className="tx-input tx-input--with-prefix"
            min="0"
            step="0.01"
            aria-label="Amount"
          />
        </div>

        <select
          value={spForm.frequency}
          onChange={(e) => setSpForm((p) => ({ ...p, frequency: e.target.value }))}
          className="tx-select"
          aria-label="Frequency"
        >
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>

        <label className="tx-field-label">Subscription start date</label>
        <input
          type="date"
          value={spForm.startDate}
          onChange={(e) => setSpForm((p) => ({ ...p, startDate: e.target.value }))}
          className="tx-input"
          aria-label="Start date"
        />

        <button type="button" className="tx-submit" onClick={handleAdd}>
          Add Scheduled Payment
        </button>
      </div>
    </div>
  );
};