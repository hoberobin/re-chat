import { useState, useEffect } from "react";
import { DailyPuzzleView } from "../components/DailyPuzzleView";
import { OnboardingOverlay } from "../components/OnboardingOverlay";
import { getDailyPuzzle, submitAnswer } from "../api/puzzles";
import type { DailyPuzzle as DailyPuzzleType, PuzzleResult } from "../types/puzzle";

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';

// ─── Storage keys ────────────────────────────────────────────────────────────

const STORAGE_KEY = "rechat-mystery";
const HISTORY_KEY = "rechat-history";
const ONBOARDED_KEY = "rechat-onboarded";

// ─── Today's result (single-day) ─────────────────────────────────────────────

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

// ─── Play history (multi-day, for streak) ────────────────────────────────────

type HistoryMap = Record<string, { correct: boolean }>;

function getHistory(): HistoryMap {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as HistoryMap) : {};
  } catch {
    return {};
  }
}

function saveToHistory(date: string, correct: boolean): void {
  try {
    const history = getHistory();
    history[date] = { correct };
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {}
}

function computeStreak(history: HistoryMap): number {
  let streak = 0;
  const now = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key =
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0");
    if (history[key] !== undefined) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// ─── Onboarding ──────────────────────────────────────────────────────────────

function hasOnboarded(): boolean {
  return localStorage.getItem(ONBOARDED_KEY) === "true";
}

function markOnboarded(): void {
  try {
    localStorage.setItem(ONBOARDED_KEY, "true");
  } catch {}
}

// ─── Date util ───────────────────────────────────────────────────────────────

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

// ─── Skeleton loading UI ──────────────────────────────────────────────────────

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

// ─── Main component ───────────────────────────────────────────────────────────

export function DailyPuzzle() {
  const today = getTodayDateString();

  const [puzzle, setPuzzle] = useState<DailyPuzzleType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [result, setResult] = useState<PuzzleResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [streak, setStreak] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const stored = loadStoredResult(today);
    const history = getHistory();
    setStreak(computeStreak(history));

    getDailyPuzzle()
      .then((p) => {
        if (cancelled) return;
        setPuzzle(p);
        if (stored) {
          setSelectedIndex(stored.selectedIndex);
          setResult(stored.result);
          // Returning player — mark onboarded silently
          markOnboarded();
        } else if (!hasOnboarded()) {
          setShowOnboarding(true);
        }
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load today's puzzle");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [today]);

  const handleDismissOnboarding = () => {
    markOnboarded();
    setShowOnboarding(false);
  };

  const handleSelect = (index: number) => {
    if (submitting || selectedIndex !== null || !puzzle) return;
    setSelectedIndex(index);

    setTimeout(async () => {
      setSubmitting(true);
      try {
        const res = await submitAnswer(puzzle.date, index);
        setResult(res);
        saveStoredResult({ date: today, selectedIndex: index, result: res });
        saveToHistory(today, res.correct);
        setStreak(computeStreak(getHistory()));
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
          position: "relative",
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
                  <p style={{ color: "#FF3B30", fontSize: 16 }}>
                    Unable to load today's puzzle.
                  </p>
                  <p style={{ color: "#8e8e93", fontSize: 14 }}>
                    Check your connection and try again.
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
          <>
            <DailyPuzzleView
              puzzle={puzzle}
              selectedIndex={selectedIndex}
              onSelectOption={handleSelect}
              submitting={submitting}
              result={result}
              streak={streak}
            />
            {showOnboarding && (
              <OnboardingOverlay onDismiss={handleDismissOnboarding} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
