import { ChatThread, ChatThreadHeader } from "./ChatThread";
import { AnswerOptions } from "./AnswerOptions";
import { ResultReveal } from "./ResultReveal";
import type { DailyPuzzle, PuzzleResult } from "../types/puzzle";
import { getOptionSenderName, getOrderedSenders } from "../utils/chatColors";
import { Box, Stack, Text } from "@mantine/core";

export interface DailyPuzzleViewProps {
  puzzle: DailyPuzzle;
  selectedIndex?: number | null;
  onSelectOption?: (index: number) => void;
  submitting?: boolean;
  result?: PuzzleResult | null;
  subtitle?: string;
}

export function DailyPuzzleView({
  puzzle,
  selectedIndex = null,
  onSelectOption,
  submitting = false,
  result = null,
  subtitle,
}: DailyPuzzleViewProps) {
  const questionPrompt = (puzzle.premise.split(/\.\s+/).filter(Boolean).pop() ?? puzzle.premise).trim();
  const uniqueSenders = new Set(puzzle.messages.map((m) => m.sender)).size;
  const orderedSenders = getOrderedSenders(puzzle.messages);
  const displaySubtitle = subtitle ?? `Today's puzzle · ${questionPrompt}`;

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
      <ChatThreadHeader
        chatName={puzzle.chat_name}
        isGroup={puzzle.is_group}
        uniqueSenders={uniqueSenders}
        premise={puzzle.premise}
        title={puzzle.title}
        subtitle={displaySubtitle}
      />

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
          premise={puzzle.premise}
          showHeader={false}
          showPremiseInBody={false}
          orderedSenders={orderedSenders}
        />
      </Box>

      <Box
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
        <Box style={{ padding: "20px 16px 28px", paddingBottom: "max(28px, env(safe-area-inset-bottom))" }}>
          {result != null ? (
            <ResultReveal
              correct={result.correct}
              correctAnswerText={
                getOptionSenderName(puzzle.options[result.correct_option_index]) ??
                puzzle.options[result.correct_option_index]
              }
              explanation={result.explanation}
              stats={result.stats}
            />
          ) : (
            <Stack gap={14}>
              <Text size="md" fw={600} c="dark" ta="center" mb={4}>
                {questionPrompt}
              </Text>
              <Text size="sm" c="dimmed" ta="center" mb={14}>
                Pick the answer that fits the clues in the chat.
              </Text>
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
