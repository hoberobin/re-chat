import type { ReactNode } from "react";

const LABELS = ["A", "B", "C"];

interface AnswerOptionsProps {
  options: string[];
  onSelect: (index: number) => void;
  selectedIndex: number | null;
  disabled: boolean;
  correctIndex: number | null;
}

export function AnswerOptions({
  options,
  onSelect,
  selectedIndex,
  disabled,
  correctIndex,
}: AnswerOptionsProps) {
  const revealed = selectedIndex !== null && correctIndex !== null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {options.map((option, i) => {
        const isSelected = selectedIndex === i;
        const isCorrect = correctIndex === i;

        let bg = "#fff";
        let border = "1.5px solid #d1d1d6";
        let color = "#000";
        let opacity = 1;
        let icon: ReactNode = null;

        if (revealed) {
          if (isCorrect) {
            bg = "#34C759";
            border = "1.5px solid #34C759";
            color = "#fff";
            icon = (
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                style={{ flexShrink: 0 }}
              >
                <path
                  d="M3 8L7 12L13 4"
                  stroke="#fff"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            );
          } else if (isSelected && !isCorrect) {
            bg = "#FF3B30";
            border = "1.5px solid #FF3B30";
            color = "#fff";
            icon = (
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                style={{ flexShrink: 0 }}
              >
                <path
                  d="M2 2L12 12M12 2L2 12"
                  stroke="#fff"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            );
          } else {
            opacity = 0.4;
          }
        } else if (isSelected) {
          // Selecting but result not yet back
          border = "1.5px solid #007AFF";
          bg = "#f0f7ff";
        }

        return (
          <button
            key={i}
            onClick={() => !disabled && onSelect(i)}
            disabled={disabled}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              width: "100%",
              padding: "13px 16px",
              background: bg,
              border,
              borderRadius: 12,
              color,
              fontSize: 15,
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              textAlign: "left",
              cursor: disabled ? "default" : "pointer",
              opacity,
              transition: "background 0.2s, opacity 0.2s, border 0.2s",
            }}
            onMouseEnter={(e) => {
              if (disabled || selectedIndex !== null) return;
              (e.currentTarget as HTMLButtonElement).style.background =
                "#f5f5f7";
            }}
            onMouseLeave={(e) => {
              if (disabled || selectedIndex !== null) return;
              (e.currentTarget as HTMLButtonElement).style.background = "#fff";
            }}
          >
            {/* A/B/C circle */}
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: revealed
                  ? isCorrect
                    ? "rgba(255,255,255,0.25)"
                    : isSelected
                    ? "rgba(255,255,255,0.25)"
                    : "rgba(0,0,0,0.08)"
                  : isSelected
                  ? "#007AFF"
                  : "#e5e5ea",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 700,
                color: revealed
                  ? "#fff"
                  : isSelected
                  ? "#fff"
                  : "#636366",
                flexShrink: 0,
                transition: "background 0.2s, color 0.2s",
              }}
            >
              {LABELS[i]}
            </div>

            {/* Option text */}
            <span style={{ flex: 1, lineHeight: 1.4 }}>{option}</span>

            {/* Correct/wrong icon */}
            {icon}
          </button>
        );
      })}
    </div>
  );
}
