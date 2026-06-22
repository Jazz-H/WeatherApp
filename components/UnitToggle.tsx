import type { Units } from "../types/weather";

interface UnitToggleProps {
  units: Units;
  onChange: (units: Units) => void;
}

const UnitToggle = ({ units, onChange }: UnitToggleProps) => {
  return (
    <div
      className="inline-flex rounded-full bg-white/10 border border-white/20 p-1 text-sm"
      role="group"
      aria-label="Temperature units"
    >
      {(["imperial", "metric"] as Units[]).map((u) => {
        const active = units === u;
        return (
          <button
            key={u}
            type="button"
            onClick={() => onChange(u)}
            aria-pressed={active}
            className={`px-3 py-1 rounded-full transition ${
              active ? "bg-white text-slate-900 font-semibold" : "text-white/80"
            }`}
          >
            {u === "imperial" ? "°F" : "°C"}
          </button>
        );
      })}
    </div>
  );
};

export default UnitToggle;
