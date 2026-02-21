import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { listDailyPuzzles, deleteDailyPuzzle } from "../api/puzzles";
import type { DailyPuzzleListItem } from "../api/puzzles";
import {
  Box,
  Group,
  Title,
  Text,
  Button,
  Anchor,
  Paper,
  Table,
  Alert,
} from "@mantine/core";

export function DailyPuzzlesList() {
  const [items, setItems] = useState<DailyPuzzleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listDailyPuzzles();
      setItems(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load puzzles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    setDeletingId(id);
    setError(null);
    try {
      await deleteDailyPuzzle(id);
      setConfirmDeleteId(null);
      setItems((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Box
      component="div"
      style={{
        minHeight: "100vh",
        background: "#f5f5f7",
        padding: 24,
      }}
    >
      <Box style={{ maxWidth: 800, margin: "0 auto" }}>
        <Group justify="space-between" align="center" mb={24}>
          <Title order={1} size="h3" fw={700} style={{ margin: 0 }}>
            Daily puzzles
          </Title>
          <Button component={Link} to="/puzzle/new" variant="filled" radius="md" fw={600} size="md">
            Create puzzle
          </Button>
        </Group>

        {error && (
          <Alert color="red" variant="light" radius="md" mb={16}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Text size="sm" c="dimmed">
            Loading…
          </Text>
        ) : items.length === 0 ? (
          <Paper
            p={48}
            ta="center"
            radius="lg"
            withBorder
            style={{ borderStyle: "dashed", borderColor: "#d1d1d6" }}
          >
            <Text size="sm" c="dimmed" mb={16}>
              No puzzles yet.
            </Text>
            <Button component={Link} to="/puzzle/new" variant="filled" radius="md" fw={600}>
              Create your first puzzle
            </Button>
          </Paper>
        ) : (
          <Paper radius="lg" shadow="sm" style={{ overflow: "hidden" }}>
            <Table>
              <Table.Thead>
                <Table.Tr style={{ background: "#f9f9f9", borderBottom: "1px solid #e5e5ea" }}>
                  <Table.Th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#6b6b70" }}>
                    Date
                  </Table.Th>
                  <Table.Th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#6b6b70" }}>
                    Title
                  </Table.Th>
                  <Table.Th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#6b6b70" }}>
                    ID
                  </Table.Th>
                  <Table.Th ta="right" style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#6b6b70" }}>
                    Actions
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {items.map((p) => (
                  <Table.Tr key={p.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <Table.Td style={{ padding: "12px 16px", fontSize: 14 }}>{p.date}</Table.Td>
                    <Table.Td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 500 }}>{p.title}</Table.Td>
                    <Table.Td style={{ padding: "12px 16px", fontSize: 13, color: "#6b6b70", fontFamily: "monospace" }}>
                      {p.id}
                    </Table.Td>
                    <Table.Td ta="right" style={{ padding: "12px 16px" }}>
                      <Anchor component={Link} to={`/puzzle/${p.id}?preview=true`} mr={8} size="sm" c="#007AFF">
                        Preview
                      </Anchor>
                      <Anchor component={Link} to={`/puzzle/${p.id}`} mr={8} size="sm" c="#007AFF">
                        Edit
                      </Anchor>
                      <Button
                        type="button"
                        variant={confirmDeleteId === p.id ? "filled" : "outline"}
                        color="red"
                        size="xs"
                        radius="sm"
                        loading={deletingId === p.id}
                        onClick={() => handleDelete(p.id)}
                      >
                        {confirmDeleteId === p.id ? "Confirm delete?" : "Delete"}
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
        )}
      </Box>
    </Box>
  );
}
