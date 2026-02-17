import { useState } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock } from "@fortawesome/free-solid-svg-icons";
import { DevToolsContext } from "./context/DevToolsContext";
import { useDevTools } from "./hooks/useDevTools";
import { Play } from "./pages/Play";
import { CreatePuzzle } from "./pages/CreatePuzzle";
import { CodeModal } from "./components/CodeModal";

function App() {
  const { unlocked, checkCode, DevPanel, devContextValue } = useDevTools();
  const [codeModalOpen, setCodeModalOpen] = useState(false);

  return (
    <DevToolsContext.Provider value={devContextValue}>
      <BrowserRouter>
        <div className="relative">
          <nav className="fixed top-0 left-0 right-0 h-12 bg-white/80 backdrop-blur border-b border-gray-200 flex items-center justify-center gap-6 z-10">
            <Link
              to="/"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Play
            </Link>
            {unlocked && (
              <Link
                to="/create"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Create
              </Link>
            )}
            <button
              type="button"
              onClick={() => setCodeModalOpen(true)}
              aria-label="Enter code"
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              <FontAwesomeIcon icon={faLock} className="w-5 h-5" />
            </button>
          </nav>

          <main className="pt-12">
            <Routes>
              <Route path="/" element={<Play />} />
              <Route
                path="/create"
                element={
                  unlocked ? <CreatePuzzle /> : <Navigate to="/" replace />
                }
              />
            </Routes>
          </main>

          {unlocked && DevPanel}

          <CodeModal
            isOpen={codeModalOpen}
            onClose={() => setCodeModalOpen(false)}
            onUnlock={checkCode}
          />
        </div>
      </BrowserRouter>
    </DevToolsContext.Provider>
  );
}

export default App;
