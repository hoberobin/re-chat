import { useState, useEffect } from "react";
import { DailyPuzzleView } from "../components/DailyPuzzleView";
import { getDailyPuzzle, submitAnswer } from "../api/puzzles";
import type { DailyPuzzle as DailyPuzzleType, PuzzleResult } from "../types/puzzle";

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';

const STORAGE_KEY = "rechat-mystery";

interface StoredDailyResult {
  date: string;
  selectedIndex: number;
  result: PuzzleResult;
}

function loadStoredResult(date: string): StoredDailyResult | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredDailyResult;
    return parsed.date === date ? parsed : null;
  } catch {
    return null;
  }
}

function saveStoredResult(data: StoredDailyResult): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

function getTodayDateString(): string {
  const d = new Date();
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

function SkeletonHeader() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "10px 16px",
        borderBottom: "1px solid #e5e5ea",
        background: "#fff",
        minHeight: 44,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 100,
          height: 12,
          background: "#e5e5ea",
          borderRadius: 6,
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      />
    </div>
  );
}

function SkeletonMessages() {
  const bars = [
    { width: "62%", self: false },
    { width: "45%", self: true },
    { width: "75%", self: false },
    { width: "38%", self: false },
    { width: "55%", self: true },
    { width: "70%", self: false },
    { width: "42%", self: true },
  ];

  return (
    <div
      style={{
        padding: "16px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {bars.map((bar, i) => (
        <div
          key={i}
          style={{ display: "flex", justifyContent: bar.self ? "flex-end" : "flex-start" }}
        >
          <div
            style={{
              width: bar.width,
              height: 40,
              background: "#e5e5ea",
              borderRadius: 18,
              animation: `pulse 1.5s ease-in-out ${i * 0.1}s infinite`,
            }}
          />
        </div>
      ))}
    </div>
  );
}

export function DailyPuzzle() {
  const today = getTodayDateString();

  const [puzzle, setPuzzle] = useState<DailyPuzzleType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [result, setResult] = useState<PuzzleResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const stored = loadStoredResult(today);

    getDailyPuzzle()
      .then((p) => {
        if (cancelled) return;
        setPuzzle(p);
        if (stored) {
          setSelectedIndex(stored.selectedIndex);
          setResult(stored.result);
        }
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load today's puzzle");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [today]);

  const handleSelect = (index: number) => {
    if (submitting || selectedIndex !== null || !puzzle) return;
    setSelectedIndex(index);

    setTimeout(async () => {
      setSubmitting(true);
      try {
        const res = await submitAnswer(puzzle.date, index);
        setResult(res);
        saveStoredResult({ date: today, selectedIndex: index, result: res });
      } catch (err) {
        console.error("Failed to submit answer:", err);
      } finally {
        setSubmitting(false);
      }
    }, 600);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "stretch",
        background: "#e5e5ea",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 430,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#fff",
          overflow: "hidden",
          fontFamily: FONT,
        }}
      >
        {loading || !puzzle ? (
          <>
            <SkeletonHeader />
            <div
              style={{
                flex: 1,
                minHeight: "45vh",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {loading && <SkeletonMessages />}
              {!loading && error && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    flex: 1,
                    minHeight: 200,
                    gap: 12,
                    padding: "24px",
                    textAlign: "center",
                  }}
                >
                  <p style={{ color: "#FF3B30", fontSize: 16 }}>{error}</p>
                  <p style={{ color: "#8e8e93", fontSize: 14 }}>
                    Make sure the server is running (npm run dev:all)
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    style={{
                      marginTop: 8,
                      padding: "10px 24px",
                      background: "#007AFF",
                      color: "#fff",
                      border: "none",
                      borderRadius: 10,
                      fontSize: 15,
                      cursor: "pointer",
                      fontFamily: FONT,
                    }}
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <DailyPuzzleView
            puzzle={puzzle}
            selectedIndex={selectedIndex}
            onSelectOption={handleSelect}
            submitting={submitting}
            result={result}
            subtitle={`Today's puzzle · ${(puzzle.premise.split(/\.\s+/).filter(Boolean).pop() ?? puzzle.premise).trim()}`}
          />
        )}
      </div>
    </div>
  );
}
