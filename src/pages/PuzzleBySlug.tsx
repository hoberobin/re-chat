import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getPuzzle } from "../api/puzzles";
import type { Puzzle } from "../types/puzzle";
import { Play } from "./Play";
import { Box, Center, Text, Button, Stack } from "@mantine/core";

interface PuzzleBySlugProps {
  embed?: boolean;
}

export function PuzzleBySlug({ embed = false }: PuzzleBySlugProps) {
  const { id } = useParams<{ id: string }>();
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    getPuzzle(id)
      .then((p) => {
        setPuzzle(p ?? null);
        if (!p) setError("Puzzle not found");
      })
      .catch(() => setError("Failed to load puzzle"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Center
        component="div"
        w="100%"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: embed ? 400 : "100vh",
        }}
      >
        <Text size={embed ? "sm" : "md"} c="dimmed">Loading puzzle…</Text>
      </Center>
    );
  }

  if (error || !puzzle) {
    if (embed) {
      return (
        <Center component="div" w="100%" mih={400} style={{ flexDirection: "column" }}>
          <Text size="sm" c="dimmed">Puzzle not found.</Text>
        </Center>
      );
    }
    return (
      <Center component="div" w="100%" mih="100vh" px="md" style={{ flexDirection: "column", gap: 16 }}>
        <Text size="sm" c="dimmed">Puzzle not found.</Text>
        <Stack gap="sm" align="center">
          <Button component={Link} to="/" variant="subtle" color="gray">
            Go home
          </Button>
          <Button component={Link} to="/create" variant="filled" color="dark" size="md" fw={500} radius="lg">
            Create your own
          </Button>
        </Stack>
      </Center>
    );
  }

  if (embed) {
    return (
      <Box style={{ minHeight: 500 }}>
        <Play previewPuzzle={puzzle} />
      </Box>
    );
  }

  return <Play previewPuzzle={puzzle} />;
}
