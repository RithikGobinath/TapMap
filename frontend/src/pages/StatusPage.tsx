const backendEndpoints = ["POST /api/score", "GET /api/wells", "POST /api/submit"];

export function StatusPage(): JSX.Element {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Phase 1 Status</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">Backend stubs expected for this phase:</p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
        {backendEndpoints.map((endpoint) => (
          <li key={endpoint}>{endpoint}</li>
        ))}
      </ul>
    </section>
  );
}
