import { useState } from "react";
import { Stack, Text, Button, Box } from "@mantine/core";

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
    <Stack
      gap="xs"
      className="animate-result"
    >
      <Text size="xl" fw={700} ta="center" c={correct ? "green" : "red"}>
        {correct ? "✓ Got it" : "✗ Missed it"}
      </Text>

      {correctAnswerText != null && correctAnswerText !== "" && (
        <Text size="md" fw={600} ta="center" c="dark">
          Answer: {correctAnswerText}
        </Text>
      )}

      {showExplanation && (
        <Box
          p="md"
          style={{
            background: "#f2f2f7",
            borderRadius: 14,
            fontSize: 15,
            color: "#1c1c1e",
            lineHeight: 1.6,
          }}
        >
          {explanation}
        </Box>
      )}
      {explanation && !showExplanation && (
        <Button
          variant="subtle"
          color="primary"
          size="md"
          fw={600}
          onClick={() => setShowExplanation(true)}
          style={{ alignSelf: "center" }}
        >
          See why
        </Button>
      )}

      <Text size="sm" c="dimmed" ta="center">
        {stats.total_plays > 0
          ? `${pct}% of players got today's puzzle`
          : "Be the first to play!"}
      </Text>
    </Stack>
  );
}
