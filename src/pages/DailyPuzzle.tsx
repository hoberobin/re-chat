import { useState, useEffect } from "react";
import { ChatThread, ChatThreadHeader } from "../components/ChatThread";
import { AnswerOptions } from "../components/AnswerOptions";
import { ResultReveal } from "../components/ResultReveal";
import { getDailyPuzzle, submitAnswer } from "../api/puzzles";
import type { DailyPuzzle as DailyPuzzleType, PuzzleResult } from "../types/puzzle";
import { getOptionSenderName } from "../utils/chatColors";

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';

// ---------------------------------------------------------------------------
// Local storage helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Skeleton header (shown during load so the chrome doesn't jump)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Skeleton messages (fills the scroll area during load)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

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

  // Use last sentence of premise as the short question (e.g. "Who spoiled it?")
  const questionPrompt = puzzle
    ? (puzzle.premise.split(/\.\s+/).filter(Boolean).pop() ?? puzzle.premise).trim()
    : "";

  const uniqueSenders = puzzle
    ? new Set(puzzle.messages.map((m) => m.sender)).size
    : 0;

  // -------------------------------------------------------------------------
  // Outer shell — fixed to the full viewport, max-width 430px centered
  // -------------------------------------------------------------------------
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "stretch",
        background: "#e5e5ea", // subtle gray shows on wide desktop screens
      }}
    >
      {/* Phone column */}
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
        {/* ---------------------------------------------------------------- */}
        {/* STICKY HEADER — never scrolls                                     */}
        {/* ---------------------------------------------------------------- */}
        {loading || !puzzle ? (
          <SkeletonHeader />
        ) : (
          <ChatThreadHeader
            chatName={puzzle.chat_name}
            isGroup={puzzle.is_group}
            uniqueSenders={uniqueSenders}
            premise={puzzle.premise}
            title={puzzle.title}
            subtitle={`Today's puzzle · ${questionPrompt}`}
          />
        )}

        {/* ---------------------------------------------------------------- */}
        {/* SCROLLABLE CHAT ONLY — messages + fake input bar                  */}
        {/* ---------------------------------------------------------------- */}
        <div
          style={{
            flex: 1,
            minHeight: "45vh",
            overflowY: "auto",
            overflowX: "hidden",
            WebkitOverflowScrolling: "touch" as React.CSSProperties["WebkitOverflowScrolling"],
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Loading state */}
          {loading && <SkeletonMessages />}

          {/* Error state */}
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

          {/* Chat only (no header — it's sticky above) */}
          {!loading && puzzle && (
            <ChatThread
              messages={puzzle.messages}
              chatName={puzzle.chat_name}
              isGroup={puzzle.is_group}
              premise={puzzle.premise}
              showHeader={false}
              showPremiseInBody={false}
            />
          )}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* FIXED BOTTOM SECTION — during: question + options; after: reveal only */}
        {/* ---------------------------------------------------------------- */}
        {!loading && puzzle && (
          <div
            style={{
              flexShrink: 0,
              background: "#fff",
              borderTop: "1px solid #e5e5ea",
              ...(result
                ? {
                    maxHeight: "55vh",
                    overflowY: "auto" as const,
                    WebkitOverflowScrolling: "touch" as React.CSSProperties["WebkitOverflowScrolling"],
                  }
                : {}),
            }}
          >
            <div style={{ padding: "20px 16px 28px", paddingBottom: "max(28px, env(safe-area-inset-bottom))" }}>
              {result == null ? (
                <>
                  <p
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: "#1c1c1e",
                      marginBottom: 4,
                      textAlign: "center",
                    }}
                  >
                    {questionPrompt}
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      color: "#6b6b70",
                      marginBottom: 14,
                      textAlign: "center",
                    }}
                  >
                    Pick the answer that fits the clues in the chat.
                  </p>
                  <AnswerOptions
                    options={puzzle.options}
                    onSelect={handleSelect}
                    selectedIndex={selectedIndex}
                    disabled={submitting || selectedIndex !== null}
                    correctIndex={null}
                  />
                </>
              ) : (
                <ResultReveal
                  correct={result.correct}
                  correctAnswerText={
                    getOptionSenderName(puzzle.options[result.correct_option_index]) ??
                    puzzle.options[result.correct_option_index]
                  }
                  explanation={result.explanation}
                  stats={result.stats}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
