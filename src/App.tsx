import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Landing } from "./pages/Landing";
import { PlayPuzzle } from "./pages/PlayPuzzle";
import { EmbedPuzzle } from "./pages/EmbedPuzzle";
import { CreatePuzzle } from "./pages/CreatePuzzle";

function AppContent() {
  return (
    <div className="relative min-h-screen">
        <main>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/create" element={<CreatePuzzle />} />
            <Route path="/p/:id" element={<PlayPuzzle />} />
            <Route path="/embed/:id" element={<EmbedPuzzle />} />
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
