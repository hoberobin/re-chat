import { useState } from "react";

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';

interface ResultRevealProps {
  correct: boolean;
  correctAnswerText?: string;
  explanation: string;
  stats: { total_plays: number; correct_plays: number };
}

export function ResultReveal({
  correct,
  correctAnswerText,
  explanation,
  stats,
}: ResultRevealProps) {
  const [showExplanation, setShowExplanation] = useState(false);
  const pct =
    stats.total_plays > 0
      ? Math.round((stats.correct_plays / stats.total_plays) * 100)
      : 0;

  return (
    <div
      className="animate-result"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        fontFamily: FONT,
      }}
    >
      {/* Result headline */}
      <div
        style={{
          textAlign: "center",
          fontSize: 22,
          fontWeight: 700,
          color: correct ? "#34C759" : "#FF3B30",
        }}
      >
        {correct ? "✓ Got it" : "✗ Missed it"}
      </div>

      {/* Correct answer */}
      {correctAnswerText != null && correctAnswerText !== "" && (
        <div
          style={{
            textAlign: "center",
            fontSize: 16,
            fontWeight: 600,
            color: "#1c1c1e",
          }}
        >
          Answer: {correctAnswerText}
        </div>
      )}

      {/* Explanation — hidden by default, "See why" toggles */}
      {showExplanation && (
        <div
          style={{
            background: "#f2f2f7",
            borderRadius: 14,
            padding: "20px 18px",
            fontSize: 15,
            color: "#1c1c1e",
            lineHeight: 1.6,
          }}
        >
          {explanation}
        </div>
      )}
      {explanation && !showExplanation && (
        <button
          type="button"
          onClick={() => setShowExplanation(true)}
          style={{
            alignSelf: "center",
            padding: "10px 18px",
            fontSize: 14,
            fontWeight: 600,
            color: "#007AFF",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontFamily: FONT,
          }}
        >
          See why
        </button>
      )}

      {/* Stats */}
      <div style={{ textAlign: "center", fontSize: 13, color: "#8e8e93" }}>
        {stats.total_plays > 0
          ? `${pct}% of players got today's puzzle`
          : "Be the first to play!"}
      </div>
    </div>
  );
}
