import { Link } from "react-router-dom";

export function HomePage(): JSX.Element {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">TapMap Frontend Build</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Phase 1 foundation is complete and Phase 2 map features are now available.
      </p>
      <div className="mt-4">
        <Link
          to="/phase-2"
          className="inline-flex items-center rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800"
        >
          Open Phase 2 Map
        </Link>
      </div>
    </section>
  );
}
