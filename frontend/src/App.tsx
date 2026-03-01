import { Link, Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { StatusPage } from "./pages/StatusPage";

export default function App(): JSX.Element {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold">TapMap Phase 1</h1>
          <nav className="flex gap-4 text-sm">
            <Link className="text-sky-700 hover:underline" to="/">
              Home
            </Link>
            <Link className="text-sky-700 hover:underline" to="/status">
              Status
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/status" element={<StatusPage />} />
        </Routes>
      </main>
    </div>
  );
}
