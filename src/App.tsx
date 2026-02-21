import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import { DailyPuzzle } from "./pages/DailyPuzzle";
import { Landing } from "./pages/Landing";
import { PuzzleBySlug } from "./pages/PuzzleBySlug";
import { Practice } from "./pages/Practice";
import { DailyPuzzlesList } from "./pages/DailyPuzzlesList";
import { DailyPuzzleForm } from "./pages/DailyPuzzleForm";
import { Box, Button } from "@mantine/core";

const isDevMode = import.meta.env.VITE_DEV_MODE === "true";

function AppContent() {
  return (
    <Box style={{ position: "relative", minHeight: "100vh" }}>
      {isDevMode && (
        <Box
          style={{
            background: "#f0f4ff",
            borderBottom: "1px solid #dde2f0",
            padding: "6px 16px",
            fontSize: 13,
          }}
        >
          <Button component={Link} to="/puzzle" variant="subtle" color="blue" size="compact-sm" fw={500}>
            Puzzle
          </Button>
        </Box>
      )}
      <Box component="main">
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
      </Box>
    </Box>
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
