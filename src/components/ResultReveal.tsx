import { useState, useEffect } from "react";
import { Stack, Text, Button, Box } from "@mantine/core";

interface ResultRevealProps {
  correct: boolean;
  correctAnswerText?: string;
  explanation: string;
  stats: { total_plays: number; correct_plays: number };
  streak?: number;
}

function getCountdownToMidnight(): string {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight.getTime() - now.getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m`;
}

export function ResultReveal({
  correct,
  correctAnswerText,
  explanation,
  stats,
  streak,
}: ResultRevealProps) {
  const [showExplanation, setShowExplanation] = useState(false);
  const [countdown, setCountdown] = useState(getCountdownToMidnight);

  useEffect(() => {
    const id = setInterval(() => setCountdown(getCountdownToMidnight()), 60_000);
    return () => clearInterval(id);
  }, []);

  const pct =
    stats.total_plays > 0
      ? Math.round((stats.correct_plays / stats.total_plays) * 100)
      : 0;

  return (
    <Stack gap="sm" className="animate-result">
      {/* Outcome */}
      <Text size="xl" fw={700} ta="center" c={correct ? "green" : "red"}>
        {correct ? "✓ Got it" : "✗ Missed it"}
      </Text>

      {/* Streak */}
      {streak != null && streak > 1 && (
        <Text size="sm" ta="center" c="dimmed">
          {streak}-day streak 🔥
        </Text>
      )}

      {/* Correct answer */}
      {correctAnswerText != null && correctAnswerText !== "" && (
        <Text size="md" fw={600} ta="center" c="dark">
          Answer: {correctAnswerText}
        </Text>
      )}

      {/* Explanation toggle */}
      {explanation && !showExplanation && (
        <Button
          variant="subtle"
          color="primary"
          size="md"
          fw={600}
          onClick={() => setShowExplanation(true)}
          style={{ alignSelf: "center" }}
        >
          See why →
        </Button>
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

      {/* Stats */}
      <Text size="sm" c="dimmed" ta="center">
        {stats.total_plays > 0
          ? `${pct}% of players got today's puzzle`
          : "Be the first to play!"}
      </Text>

      {/* Divider */}
      <Box style={{ borderTop: "1px solid #e5e5ea", marginTop: 4 }} />

      {/* Next puzzle countdown */}
      <Stack gap={2} align="center">
        <Text size="xs" c="dimmed" tt="uppercase" fw={600} lts="0.06em">
          Next puzzle in
        </Text>
        <Text size="lg" fw={700} c="dark">
          {countdown}
        </Text>
      </Stack>

    </Stack>
  );
}
