import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Play, type DailyPersistedState } from "./Play";
import { getDailyPuzzleLegacy } from "../api/puzzles";
import type { Puzzle } from "../types/legacy";

const STORAGE_KEY = "rechat-daily";

function getTodayDateString(): string {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function loadPersistedState(date: string): DailyPersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DailyPersistedState;
    return parsed.date === date ? parsed : null;
  } catch {
    return null;
  }
}

function savePersistedState(state: DailyPersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function Landing() {
  const [daily, setDaily] = useState<{ puzzle: Puzzle; initialOrder: string[]; date: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [persistedState, setPersistedState] = useState<DailyPersistedState | null>(null);
  const today = getTodayDateString();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getDailyPuzzleLegacy(today)
      .then((res) => {
        if (cancelled) return;
        setDaily({ puzzle: res.puzzle, initialOrder: res.initialOrder, date: res.date });
        const saved = loadPersistedState(res.date);
        setPersistedState(saved);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load today's puzzle");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [today]);

  const handlePersist = useCallback((state: DailyPersistedState) => {
    const toSave = { ...state, date: today };
    setPersistedState(toSave);
    savePersistedState(toSave);
  }, [today]);

  if (loading) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center px-4 py-6 sm:py-8">
        <p className="text-gray-500">Loading today's puzzle…</p>
      </div>
    );
  }

  if (error || !daily) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center px-4 py-6 sm:py-8">
        <p className="text-red-600 mb-2">{error ?? "Could not load puzzle."}</p>
        <p className="text-sm text-gray-600">Make sure the server is running (npm run dev:all).</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex flex-col items-center px-4 py-6 sm:py-8">
      <div className="w-full max-w-[600px] mx-auto">
        <div className="text-center mb-4">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-1">re:chat</h1>
          <p className="text-sm text-gray-600">
            Put the messages in order. One puzzle per day. One try.
          </p>
          <p className="mt-2">
            <Link to="/practice" className="text-xs text-[#007AFF] hover:underline">
              Play yesterday's puzzle (practice)
            </Link>
          </p>
        </div>

        <Play
          previewPuzzle={daily.puzzle}
          initialOrder={daily.initialOrder}
          dailyMode
          persistedState={persistedState}
          onPersist={handlePersist}
        />
      </div>
    </div>
  );
}
