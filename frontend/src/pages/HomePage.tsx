import { Link } from "react-router-dom";

export function HomePage(): JSX.Element {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">TapMap Frontend Build</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Phase 1 and Phase 2.1 are complete. Phase 3 now adds autocomplete address search, score display cards, and
        contaminant-vs-limit charting.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          to="/phase-3"
          className="inline-flex items-center rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          Open Phase 3 Flow
        </Link>
        <Link
          to="/phase-2"
          className="inline-flex items-center rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800"
        >
          Open Phase 2.1 Map
        </Link>
      </div>
    </section>
  );
}
