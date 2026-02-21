import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DailyPuzzle } from "./pages/DailyPuzzle";
import { DailyPuzzlesList } from "./pages/DailyPuzzlesList";
import { DailyPuzzleForm } from "./pages/DailyPuzzleForm";
import { Box, Button } from "@mantine/core";
import { Link } from "react-router-dom";

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
          {isDevMode && <Route path="/puzzle" element={<DailyPuzzlesList />} />}
          {isDevMode && <Route path="/puzzle/new" element={<DailyPuzzleForm />} />}
          {isDevMode && <Route path="/puzzle/:id" element={<DailyPuzzleForm />} />}
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
