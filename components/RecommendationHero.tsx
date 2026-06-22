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
  const { headline, summary, activities, bestWindow } = recommendation;

  return (
    <section
      className="rounded-2xl bg-gradient-to-br from-sky-500/20 to-indigo-500/10 border border-white/15 p-5 text-white"
      aria-label="Today's recommendation"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-2xl font-bold leading-tight">{headline}</h2>
        {bestWindow && (
          <span className="flex-shrink-0 rounded-full bg-white/15 border border-white/20 px-3 py-1 text-sm font-medium">
            Best: {bestWindow}
          </span>
        )}
      </div>

      <p className="mt-2 text-white/85">{summary}</p>

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
    </section>
  );
};

export default RecommendationHero;
