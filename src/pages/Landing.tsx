import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Play, type DailyPersistedState } from "./Play";
import { getDailyPuzzleLegacy } from "../api/puzzles";
import type { Puzzle } from "../types/legacy";
import { Box, Stack, Title, Text, Button, Center } from "@mantine/core";

const STORAGE_KEY = "rechat-daily";

function getTodayDateString(): string {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function loadPersistedState(date: string): DailyPersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DailyPersistedState;
    return parsed.date === date ? parsed : null;
  } catch {
    return null;
  }
}

function savePersistedState(state: DailyPersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function Landing() {
  const [daily, setDaily] = useState<{ puzzle: Puzzle; initialOrder: string[]; date: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [persistedState, setPersistedState] = useState<DailyPersistedState | null>(null);
  const today = getTodayDateString();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getDailyPuzzleLegacy(today)
      .then((res) => {
        if (cancelled) return;
        setDaily({ puzzle: res.puzzle, initialOrder: res.initialOrder, date: res.date });
        const saved = loadPersistedState(res.date);
        setPersistedState(saved);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load today's puzzle");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [today]);

  const handlePersist = useCallback((state: DailyPersistedState) => {
    const toSave = { ...state, date: today };
    setPersistedState(toSave);
    savePersistedState(toSave);
  }, [today]);

  if (loading) {
    return (
      <Center component="div" mih="100vh" p="md" style={{ flexDirection: "column" }}>
        <Text size="sm" c="dimmed">Loading today&apos;s puzzle…</Text>
      </Center>
    );
  }

  if (error || !daily) {
    return (
      <Center component="div" mih="100vh" p="md" style={{ flexDirection: "column" }}>
        <Text size="sm" c="red" mb="xs">{error ?? "Could not load puzzle."}</Text>
        <Text size="xs" c="dimmed">Make sure the server is running (npm run dev:all).</Text>
      </Center>
    );
  }

  return (
    <Box w="100%" mih="100vh" py="md" px="md" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Box w="100%" maw={600} mx="auto">
        <Stack align="center" gap={4} mb="md">
          <Title order={1} size="h2" fw={600} ta="center">
            re:chat
          </Title>
          <Text size="sm" c="dimmed" ta="center">
            Put the messages in order. One puzzle per day. One try.
          </Text>
          <Button component={Link} to="/practice" variant="subtle" size="xs" color="primary">
            Play yesterday&apos;s puzzle (practice)
          </Button>
        </Stack>

        <Play
          previewPuzzle={daily.puzzle}
          initialOrder={daily.initialOrder}
          dailyMode
          persistedState={persistedState}
          onPersist={handlePersist}
        />
      </Box>
    </Box>
  );
}
