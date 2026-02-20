const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';

interface ResultRevealProps {
  correct: boolean;
  explanation: string;
  stats: { total_plays: number; correct_plays: number };
}

export function ResultReveal({ correct, explanation, stats }: ResultRevealProps) {
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
        gap: 16,
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

      {/* Explanation */}
      <div
        style={{
          background: "#f2f2f7",
          borderRadius: 14,
          padding: "18px 18px",
          fontSize: 15,
          color: "#1c1c1e",
          lineHeight: 1.55,
        }}
      >
        {explanation}
      </div>

      {/* Stats */}
      <div style={{ textAlign: "center", fontSize: 13, color: "#8e8e93" }}>
        {stats.total_plays > 0
          ? `${pct}% of players got today's puzzle`
          : "Be the first to play!"}
      </div>
    </div>
  );
}
