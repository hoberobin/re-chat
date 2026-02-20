import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import { DailyPuzzle } from "./pages/DailyPuzzle";
import { Landing } from "./pages/Landing";
import { PuzzleBySlug } from "./pages/PuzzleBySlug";
import { Practice } from "./pages/Practice";
import { DailyPuzzlesList } from "./pages/DailyPuzzlesList";
import { DailyPuzzleForm } from "./pages/DailyPuzzleForm";

const isDevMode = import.meta.env.VITE_DEV_MODE === "true";

function AppContent() {
  return (
    <div className="relative min-h-screen">
      {isDevMode && (
        <div
          style={{
            background: "#f0f4ff",
            borderBottom: "1px solid #dde2f0",
            padding: "6px 16px",
            fontSize: 13,
          }}
        >
          <Link to="/puzzle" style={{ color: "#2563EB", fontWeight: 500 }}>
            Puzzle
          </Link>
        </div>
      )}
      <main>
        <Routes>
          <Route path="/" element={<DailyPuzzle />} />
          <Route path="/classic" element={<Landing />} />
          {isDevMode && <Route path="/puzzle" element={<DailyPuzzlesList />} />}
          {isDevMode && <Route path="/puzzle/new" element={<DailyPuzzleForm />} />}
          {isDevMode && <Route path="/puzzle/:id" element={<DailyPuzzleForm />} />}
          <Route path="/create-daily" element={<Navigate to="/puzzle/new" replace />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/p/:id" element={<PuzzleBySlug />} />
          <Route path="/embed/:id" element={<PuzzleBySlug embed />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
