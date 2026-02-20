import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Play } from "./Play";
import { getDailyPuzzleLegacy, type LegacyDailyResponse } from "../api/puzzles";

function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

export function Practice() {
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get("date");
  const date =
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
      ? dateParam
      : getYesterdayDateString();
  const [daily, setDaily] = useState<Pick<LegacyDailyResponse, "puzzle" | "initialOrder"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getDailyPuzzleLegacy(date)
      .then((res) => {
        if (!cancelled)
          setDaily({ puzzle: res.puzzle, initialOrder: res.initialOrder });
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to load puzzle"
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date]);

  if (loading) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center px-4 py-6">
        <p className="text-gray-500">Loading puzzle…</p>
      </div>
    );
  }

  if (error || !daily) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center px-4 py-6 gap-4">
        <p className="text-red-600">{error ?? "Could not load puzzle."}</p>
        <Link to="/" className="text-[#007AFF] hover:underline">
          Back to today's puzzle
        </Link>
      </div>
    );
  }

  const isYesterday = date === getYesterdayDateString();

  return (
    <div className="w-full min-h-screen flex flex-col items-center px-4 py-6 sm:py-8">
      <div className="w-full max-w-[600px] mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">
            ← Today's puzzle
          </Link>
          <span className="text-xs text-gray-500">
            {isYesterday ? "Yesterday's puzzle" : date} — practice mode (no
            stakes)
          </span>
        </div>
        <Play previewPuzzle={daily.puzzle} initialOrder={daily.initialOrder} />
      </div>
    </div>
  );
}
