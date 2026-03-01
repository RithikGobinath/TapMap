interface ScoreDisplayCardProps {
  loading: boolean;
  error: string | null;
  score: number | null;
  grade: string | null;
  scoreColor: string;
  sourceLabel: string;
  resolvedAddress: string | null;
  zoneId: string | null;
  wellIds: string[];
  lastUpdated: string | null;
  theme?: "dark" | "light";
}

function describeScore(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Good";
  if (score >= 70) return "Moderate";
  if (score >= 60) return "Elevated concern";
  return "High concern";
}

export function ScoreDisplayCard({
  loading,
  error,
  score,
  grade,
  scoreColor,
  sourceLabel,
  resolvedAddress,
  zoneId,
  wellIds,
  lastUpdated,
  theme = "dark"
}: ScoreDisplayCardProps): JSX.Element {
  const isLight = theme === "light";
  const panelClass = isLight
    ? "relative z-[120] rounded-2xl border border-slate-300/90 bg-white/88 p-3 shadow-xl shadow-slate-300/40 backdrop-blur-md"
    : "relative z-[120] rounded-2xl border border-slate-700/70 bg-slate-950/75 p-3 shadow-xl backdrop-blur-md";

  return (
    <section className={panelClass}>
      <h3 className={`text-xs font-semibold uppercase tracking-[0.14em] ${isLight ? "text-slate-500" : "text-slate-300"}`}>
        Score Snapshot
      </h3>

      {loading ? (
        <div className="mt-3 space-y-2">
          <div className={`h-10 w-40 animate-pulse rounded-lg ${isLight ? "bg-slate-200" : "bg-slate-800"}`} />
          <div className={`h-4 w-full animate-pulse rounded ${isLight ? "bg-slate-200/90" : "bg-slate-800/80"}`} />
          <div className={`h-4 w-4/5 animate-pulse rounded ${isLight ? "bg-slate-200/90" : "bg-slate-800/80"}`} />
        </div>
      ) : null}

      {!loading && error ? (
        <p
          className={`mt-3 rounded-lg border px-3 py-2 text-sm ${
            isLight ? "border-rose-500/40 bg-rose-100 text-rose-700" : "border-rose-500/40 bg-rose-500/10 text-rose-200"
          }`}
        >
          {error}
        </p>
      ) : null}

      {!loading && !error && score != null ? (
        <div className={`mt-2 space-y-1 text-sm ${isLight ? "text-slate-700" : "text-slate-200"}`}>
          <div
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-semibold ${isLight ? "text-slate-900" : "text-white"}`}
            style={{ backgroundColor: scoreColor }}
          >
            <span>{score.toFixed(1)}</span>
            <span>({grade ?? "N/A"})</span>
          </div>
          <p className={`font-medium ${isLight ? "text-slate-900" : "text-white"}`}>{describeScore(score)}</p>
          <p>
            <span className={`font-semibold ${isLight ? "text-slate-900" : "text-slate-100"}`}>Source:</span> {sourceLabel}
          </p>
          {resolvedAddress ? (
            <p>
              <span className={`font-semibold ${isLight ? "text-slate-900" : "text-slate-100"}`}>Address:</span> {resolvedAddress}
            </p>
          ) : null}
          {zoneId ? (
            <p>
              <span className={`font-semibold ${isLight ? "text-slate-900" : "text-slate-100"}`}>Zone:</span> {zoneId}
            </p>
          ) : null}
          {wellIds.length > 0 ? (
            <p>
              <span className={`font-semibold ${isLight ? "text-slate-900" : "text-slate-100"}`}>Wells:</span> {wellIds.join(", ")}
            </p>
          ) : null}
          {lastUpdated ? (
            <p>
              <span className={`font-semibold ${isLight ? "text-slate-900" : "text-slate-100"}`}>Last updated:</span> {lastUpdated}
            </p>
          ) : null}
        </div>
      ) : null}

      {!loading && !error && score == null ? (
        <p className={`mt-2 text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}>
          Search an address or click a well zone to view score details.
        </p>
      ) : null}
    </section>
  );
}
