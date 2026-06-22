// Themed placeholders shown while the forecast loads — matches the glass cards
// so there's no jarring spinner or layout jump.
const block = "rounded-2xl bg-white/10 border border-white/10 animate-pulse";

const LoadingSkeleton = () => (
  <div className="space-y-6" role="status" aria-label="Loading forecast">
    {/* recommendation statline */}
    <div className={`${block} h-14`} />
    {/* current conditions */}
    <div className={`${block} h-32`} />
    {/* hourly strip */}
    <div className="flex gap-3 overflow-hidden">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex-shrink-0 w-20 h-24 rounded-xl bg-white/10 border border-white/10 animate-pulse"
        />
      ))}
    </div>
    {/* daily outlook */}
    <div className={`${block} h-44`} />
    <span className="sr-only">Loading forecast…</span>
  </div>
);

export default LoadingSkeleton;
