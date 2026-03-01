import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

const Phase2Page = lazy(async () => ({ default: (await import("./pages/Phase2Page")).Phase2Page }));
const Phase3Page = lazy(async () => ({ default: (await import("./pages/Phase3Page")).Phase3Page }));
const StatusPage = lazy(async () => ({ default: (await import("./pages/StatusPage")).StatusPage }));

export default function App(): JSX.Element {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#05070d] text-slate-100">
      <Suspense fallback={<p className="p-4 text-sm text-slate-300">Loading map experience...</p>}>
        <Routes>
          <Route path="/" element={<Phase3Page />} />
          <Route path="/phase-3" element={<Phase3Page />} />
          <Route path="/phase-2" element={<Phase2Page />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
}
