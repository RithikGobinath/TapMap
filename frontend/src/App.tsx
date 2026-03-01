import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

const Phase3Page = lazy(async () => ({ default: (await import("./pages/Phase3Page")).Phase3Page }));
const MetricsPage = lazy(async () => ({ default: (await import("./pages/MetricsPage")).MetricsPage }));
const ScoringPage = lazy(async () => ({ default: (await import("./pages/ScoringPage")).ScoringPage }));

export default function App(): JSX.Element {
  return (
    <div className="min-h-screen w-screen overflow-x-hidden bg-[#05070d] text-slate-100">
      <Suspense fallback={<p className="p-4 text-sm text-slate-300">Loading map experience...</p>}>
        <Routes>
          <Route path="/" element={<Phase3Page />} />
          <Route path="/phase-3" element={<Phase3Page />} />
          <Route path="/metrics" element={<MetricsPage />} />
          <Route path="/scoring" element={<ScoringPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
}
