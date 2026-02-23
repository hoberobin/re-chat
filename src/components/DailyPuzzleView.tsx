import { ChatThread, ChatThreadHeader } from "./ChatThread";
import { AnswerOptions } from "./AnswerOptions";
import { ResultReveal } from "./ResultReveal";
import type { DailyPuzzle, PuzzleResult } from "../types/puzzle";
import { getOrderedSenders } from "../utils/chatColors";
import { Box, Stack, Text } from "@mantine/core";

export interface DailyPuzzleViewProps {
  puzzle: DailyPuzzle;
  selectedIndex?: number | null;
  onSelectOption?: (index: number) => void;
  submitting?: boolean;
  result?: PuzzleResult | null;
  subtitle?: string;
  streak?: number;
}

/** Format "2026-02-20" → "Feb 20" */
function formatPuzzleDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * Split premise into context sentences + a final question sentence.
 * The last sentence (often ending in ?) is shown bold; the rest is lighter context.
 */
function PremiseCard({ premise }: { premise: string }) {
  const parts = premise.split(/(?<=[.?!])\s+/).filter(Boolean);
  const question = parts.length > 1 ? parts.pop()! : parts[0] ?? "";
  const context = parts.join(" ");

  return (
    <Box
      style={{
        background: "#f2f2f7",
        borderRadius: 12,
        padding: "12px 14px",
      }}
    >
      {context && (
        <Text size="sm" c="dimmed" lh={1.55} mb={6}>
          {context}
        </Text>
      )}
      <Text size="sm" fw={600} c="dark" lh={1.55}>
        {question}
      </Text>
    </Box>
  );
}

export function DailyPuzzleView({
  puzzle,
  selectedIndex = null,
  onSelectOption,
  submitting = false,
  result = null,
  subtitle,
  streak,
}: DailyPuzzleViewProps) {
  const orderedSenders = getOrderedSenders(puzzle.messages);

  return (
    <Box
      style={{
        width: "100%",
        maxWidth: 430,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        overflow: "hidden",
      }}
    >
      {/* App brand strip */}
      <Box
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "5px 16px",
          borderBottom: "1px solid #f0f0f0",
          background: "#fff",
          flexShrink: 0,
        }}
      >
        <Text
          size="xs"
          fw={800}
          style={{ color: "#007AFF", letterSpacing: "0.01em" }}
        >
          Re:Chat
        </Text>
        <Text size="xs" c="dimmed">
          {subtitle === "Preview" ? "Preview" : formatPuzzleDate(puzzle.date)}
        </Text>
      </Box>

      {/* Chat header */}
      <ChatThreadHeader chatName={puzzle.chat_name} />

      {/* Scrollable message area */}
      <Box
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch" as React.CSSProperties["WebkitOverflowScrolling"],
          display: "flex",
          flexDirection: "column",
        }}
      >
        <ChatThread
          messages={puzzle.messages}
          chatName={puzzle.chat_name}
          isGroup={puzzle.is_group}
          showHeader={false}
          showPremiseInBody={false}
          orderedSenders={orderedSenders}
        />
      </Box>

      {/* Answer / result panel */}
      <Box
        style={{
          flexShrink: 0,
          background: "#fff",
          borderTop: "1px solid #e5e5ea",
          ...(result
            ? {
                maxHeight: "58vh",
                overflowY: "auto" as const,
                WebkitOverflowScrolling: "touch" as React.CSSProperties["WebkitOverflowScrolling"],
              }
            : {}),
        }}
      >
        <Box
          style={{
            padding: "16px 16px 28px",
            paddingBottom: "max(28px, env(safe-area-inset-bottom))",
          }}
        >
          {result != null ? (
            <ResultReveal
              correct={result.correct}
              correctAnswerText={
                puzzle.options[result.correct_option_index] ?? undefined
              }
              explanation={result.explanation}
              stats={result.stats}
              streak={streak}
            />
          ) : (
            <Stack gap={12}>
              {subtitle !== "Preview" && (
                <Text size="xs" c="dimmed" fw={600} tt="uppercase" lts="0.05em">
                  Today&apos;s mystery
                </Text>
              )}
              <PremiseCard premise={puzzle.premise} />
              <AnswerOptions
                options={puzzle.options}
                onSelect={onSelectOption ?? (() => {})}
                selectedIndex={selectedIndex}
                disabled={onSelectOption == null || submitting || selectedIndex !== null}
                correctIndex={null}
                orderedSenders={orderedSenders}
              />
            </Stack>
          )}
        </Box>
      </Box>
    </Box>
  );
}
