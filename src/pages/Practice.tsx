import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Play } from "./Play";
import { getDailyPuzzleLegacy, type LegacyDailyResponse } from "../api/puzzles";
import { Box, Stack, Center, Text, Button } from "@mantine/core";

function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

export function Practice() {
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get("date");
  const date =
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
      ? dateParam
      : getYesterdayDateString();
  const [daily, setDaily] = useState<Pick<LegacyDailyResponse, "puzzle" | "initialOrder"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getDailyPuzzleLegacy(date)
      .then((res) => {
        if (!cancelled)
          setDaily({ puzzle: res.puzzle, initialOrder: res.initialOrder });
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to load puzzle"
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date]);

  if (loading) {
    return (
      <Center component="div" w="100%" mih="100vh" py="md" px="md" style={{ flexDirection: "column" }}>
        <Text size="sm" c="dimmed">Loading puzzle…</Text>
      </Center>
    );
  }

  if (error || !daily) {
    return (
      <Center component="div" w="100%" mih="100vh" py="md" px="md" style={{ flexDirection: "column", gap: 16 }}>
        <Text size="sm" c="red">{error ?? "Could not load puzzle."}</Text>
        <Button component={Link} to="/" variant="subtle" color="primary">
          Back to today&apos;s puzzle
        </Button>
      </Center>
    );
  }

  const isYesterday = date === getYesterdayDateString();

  return (
    <Box w="100%" mih="100vh" py="md" px="md" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Box w="100%" maw={600} mx="auto">
        <Stack gap="md" mb="md">
          <Box style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Button component={Link} to="/" variant="subtle" size="sm" color="gray">
              ← Today&apos;s puzzle
            </Button>
            <Text size="xs" c="dimmed">
              {isYesterday ? "Yesterday's puzzle" : date} — practice mode (no stakes)
            </Text>
          </Box>
        </Stack>
        <Play previewPuzzle={daily.puzzle} initialOrder={daily.initialOrder} />
      </Box>
    </Box>
  );
}
