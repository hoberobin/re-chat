import type { ReactNode } from "react";
import { getSenderColor, getOptionSenderName, splitOptionText } from "../utils/chatColors";
import { Stack, Box } from "@mantine/core";

const LABELS = ["A", "B", "C"];

interface AnswerOptionsProps {
  options: string[];
  onSelect: (index: number) => void;
  selectedIndex: number | null;
  disabled: boolean;
  correctIndex: number | null;
  orderedSenders?: string[];
}

export function AnswerOptions({
  options,
  onSelect,
  selectedIndex,
  disabled,
  correctIndex,
  orderedSenders,
}: AnswerOptionsProps) {
  const revealed = selectedIndex !== null && correctIndex !== null;

  return (
    <Stack gap={10}>
      {options.map((option, i) => {
        const isSelected = selectedIndex === i;
        const isCorrect = correctIndex === i;
        const senderName = getOptionSenderName(option);
        const senderColor = senderName ? getSenderColor(senderName, orderedSenders) : "#d1d1d6";
        const { namePart } = splitOptionText(option);
        const displayLabel = namePart ? namePart : option;

        let bg = "#fff";
        let border = "1.5px solid #d1d1d6";
        let borderLeft = `3px solid ${senderColor}`;
        let color = "#000";
        let opacity = 1;
        let icon: ReactNode = null;

        if (revealed) {
          if (isCorrect) {
            bg = "#34C759";
            border = "1.5px solid #34C759";
            borderLeft = "3px solid rgba(255,255,255,0.4)";
            color = "#fff";
            icon = (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                <path d="M3 8L7 12L13 4" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            );
          } else if (isSelected && !isCorrect) {
            bg = "#FF3B30";
            border = "1.5px solid #FF3B30";
            borderLeft = "3px solid rgba(255,255,255,0.4)";
            color = "#fff";
            icon = (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                <path d="M2 2L12 12M12 2L2 12" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            );
          } else {
            opacity = 0.4;
          }
        } else if (isSelected) {
          border = "1.5px solid #007AFF";
          bg = "#f0f7ff";
        }

        return (
          <Box
            component="button"
            type="button"
            key={i}
            className="answer-option"
            onClick={() => !disabled && onSelect(i)}
            disabled={disabled}
            aria-pressed={isSelected}
            aria-label={option}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              width: "100%",
              padding: "13px 16px",
              background: bg,
              border,
              borderLeft,
              borderRadius: 12,
              color,
              fontSize: 15,
              textAlign: "left",
              opacity,
              transition: "background 0.2s, opacity 0.2s, border 0.2s",
              cursor: disabled ? "default" : "pointer",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => {
              if (disabled || selectedIndex !== null) return;
              e.currentTarget.style.background = "#f5f5f7";
            }}
            onMouseLeave={(e) => {
              if (disabled || selectedIndex !== null) return;
              e.currentTarget.style.background = "#fff";
            }}
          >
            <Box
              component="span"
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
                color: revealed ? "#fff" : isSelected ? "#fff" : "#636366",
                flexShrink: 0,
                transition: "background 0.2s, color 0.2s",
              }}
            >
              {LABELS[i]}
            </Box>

            <span
              style={{
                flex: 1,
                minWidth: 0,
                lineHeight: 1.4,
                fontWeight: senderName && !revealed ? 600 : undefined,
                color: senderName && !revealed ? senderColor : "inherit",
              }}
            >
              {displayLabel}
            </span>

            {icon}
          </Box>
        );
      })}
    </Stack>
  );
}
