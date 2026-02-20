import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DailyPuzzle } from "./pages/DailyPuzzle";
import { Landing } from "./pages/Landing";
import { PuzzleBySlug } from "./pages/PuzzleBySlug";
import { Practice } from "./pages/Practice";
import { CreatePuzzle } from "./pages/CreatePuzzle";

function AppContent() {
  return (
    <div className="relative min-h-screen">
      <main>
        <Routes>
          <Route path="/" element={<DailyPuzzle />} />
          <Route path="/classic" element={<Landing />} />
          <Route path="/create" element={<CreatePuzzle />} />
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
