const backendEndpoints = ["POST /api/score", "GET /api/wells", "POST /api/submit"];

export function StatusPage(): JSX.Element {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Build Status</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">Backend stubs expected for this phase:</p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
        {backendEndpoints.map((endpoint) => (
          <li key={endpoint}>{endpoint}</li>
        ))}
      </ul>

      <p className="mt-5 text-sm leading-6 text-slate-600">
        Phase 2 frontend route is available at <code>/phase-2</code> with map overlays, zone click popups, and address
        geocoding-to-zone matching.
      </p>
    </section>
  );
}
