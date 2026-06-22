import { useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import type { Recommendation, Verdict } from "../lib/recommendationSchema";

interface RecommendationHeroProps {
  recommendation: Recommendation;
}

const verdictStyles: Record<Verdict, string> = {
  great: "bg-emerald-500/20 text-emerald-200 border-emerald-400/30",
  ok: "bg-amber-500/20 text-amber-100 border-amber-400/30",
  skip: "bg-rose-500/20 text-rose-200 border-rose-400/30",
};

const verdictLabel: Record<Verdict, string> = {
  great: "Great",
  ok: "OK",
  skip: "Skip",
};

const RecommendationHero = ({ recommendation }: RecommendationHeroProps) => {
  const [open, setOpen] = useState(false);
  const { headline, summary, activities, bestWindow } = recommendation;

  return (
    <section
      className="rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md text-white overflow-hidden"
      aria-label="Today's recommendation"
    >
      {/* Statline — always visible, reads as a single compact row. */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-start gap-3 px-4 py-3 text-left"
      >
        <span
          className="flex-shrink-0 mt-1.5 h-2.5 w-2.5 rounded-full bg-amber-400"
          aria-hidden
        />
        <span className="flex-1 min-w-0 font-semibold leading-snug line-clamp-2">
          {headline}
        </span>
        <FiChevronDown
          aria-hidden
          className={`flex-shrink-0 mt-0.5 text-white/70 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          size={20}
        />
      </button>

      {/* Detail — revealed on expand. */}
      {open && (
        <div className="px-4 pb-4">
          {bestWindow && (
            <p className="mb-3 rounded-xl bg-amber-400/15 text-amber-100 border border-amber-300/30 px-3 py-2 text-sm">
              <span className="font-semibold">Best window</span> — {bestWindow}
            </p>
          )}
          <p className="text-white/85">{summary}</p>

          {activities.length > 0 && (
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {activities.map((a) => (
                <li
                  key={a.name}
                  className="flex items-start gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2"
                >
                  <span
                    className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${
                      verdictStyles[a.verdict]
                    }`}
                  >
                    {verdictLabel[a.verdict]}
                  </span>
                  <span className="text-sm">
                    <span className="font-semibold">{a.name}</span>
                    <span className="text-white/70"> — {a.reason}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
};

export default RecommendationHero;
