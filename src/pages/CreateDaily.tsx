import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { DailyPuzzleView } from "../components/DailyPuzzleView";
import { createDailyPuzzle } from "../api/puzzles";
import type { DailyPuzzleCreatePayload } from "../types/puzzle";
import type { ChatMessage } from "../types/puzzle";
import {
  Box,
  Stack,
  Group,
  Title,
  Text,
  TextInput,
  Textarea,
  Button,
  Checkbox,
  Radio,
  Paper,
  Alert,
} from "@mantine/core";

function getTodayDateString(): string {
  const d = new Date();
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

function defaultMessage(i: number): ChatMessage {
  return {
    id: i + 1,
    sender: i % 2 === 0 ? "A" : "B",
    text: "",
    is_redacted: false,
    timestamp: "12:00 PM",
    show_timestamp: i === 0,
  };
}

function defaultDraft(): DailyPuzzleCreatePayload {
  return {
    date: getTodayDateString(),
    title: "",
    premise: "",
    chat_name: "",
    is_group: true,
    messages: [
      defaultMessage(0),
      defaultMessage(1),
      defaultMessage(2),
    ],
    options: ["Option A", "Option B", "Option C"],
    correct_option_index: 0,
    explanation: "",
  };
}

/** Draft as DailyPuzzle for preview (id not needed for display). */
function draftToPuzzle(draft: DailyPuzzleCreatePayload): Parameters<typeof DailyPuzzleView>[0]["puzzle"] {
  return {
    id: "draft",
    date: draft.date,
    title: draft.title || "Untitled",
    premise: draft.premise || "Premise",
    chat_name: draft.chat_name || "Chat",
    is_group: draft.is_group,
    messages: draft.messages,
    options: draft.options.filter(Boolean).length ? draft.options : ["A", "B", "C"],
  };
}

const MIN_MESSAGES = 2;
const MAX_MESSAGES = 50;

export function CreateDaily() {
  const [draft, setDraft] = useState<DailyPuzzleCreatePayload>(defaultDraft);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<{ id: string; date: string } | null>(null);
  const [publishing, setPublishing] = useState(false);

  const update = useCallback(<K extends keyof DailyPuzzleCreatePayload>(
    key: K,
    value: DailyPuzzleCreatePayload[K]
  ) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setPublishError(null);
    setPublishSuccess(null);
  }, []);

  const updateMessage = useCallback((index: number, field: keyof ChatMessage, value: string | number | boolean) => {
    setDraft((prev) => {
      const next = prev.messages.map((m, i) =>
        i === index ? { ...m, [field]: value } : m
      );
      return { ...prev, messages: next };
    });
    setPublishError(null);
    setPublishSuccess(null);
  }, []);

  const addMessage = useCallback(() => {
    setDraft((prev) => {
      if (prev.messages.length >= MAX_MESSAGES) return prev;
      return {
        ...prev,
        messages: [...prev.messages, defaultMessage(prev.messages.length)],
      };
    });
  }, []);

  const removeMessage = useCallback((index: number) => {
    setDraft((prev) => {
      if (prev.messages.length <= MIN_MESSAGES) return prev;
      const next = prev.messages.filter((_, i) => i !== index).map((m, i) => ({ ...m, id: i + 1 }));
      return { ...prev, messages: next };
    });
  }, []);

  const moveMessage = useCallback((index: number, direction: "up" | "down") => {
    setDraft((prev) => {
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.messages.length) return prev;
      const next = [...prev.messages];
      [next[index], next[newIndex]] = [next[newIndex], next[index]];
      return { ...prev, messages: next.map((m, i) => ({ ...m, id: i + 1 })) };
    });
  }, []);

  const validationErrors = (): string[] => {
    const errs: string[] = [];
    if (!draft.title.trim()) errs.push("Title is required");
    if (!draft.premise.trim()) errs.push("Premise is required");
    if (!draft.chat_name.trim()) errs.push("Chat name is required");
    if (draft.messages.length < MIN_MESSAGES) errs.push("At least 2 messages required");
    draft.messages.forEach((m, i) => {
      if (!m.sender.trim()) errs.push(`Message ${i + 1}: sender required`);
      if (!m.text.trim()) errs.push(`Message ${i + 1}: text required`);
    });
    const filledOptions = draft.options.map((o) => o.trim()).filter(Boolean);
    if (filledOptions.length < 2) errs.push("At least 2 options required");
    if (draft.correct_option_index < 0 || draft.correct_option_index >= draft.options.length)
      errs.push("Correct answer must be one of the options");
    if (!draft.explanation.trim()) errs.push("Explanation is required");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) errs.push("Release date must be YYYY-MM-DD");
    return errs;
  };

  const handlePublish = async () => {
    const errs = validationErrors();
    if (errs.length) {
      setPublishError(errs.join(". "));
      return;
    }
    setPublishing(true);
    setPublishError(null);
    setPublishSuccess(null);
    try {
      const payload: DailyPuzzleCreatePayload = {
        ...draft,
        messages: draft.messages.map((m, i) => ({
          ...m,
          id: i + 1,
          sender: m.sender.trim(),
          text: m.text.trim(),
          timestamp: m.timestamp?.trim() || "12:00 PM",
        })),
        options: draft.options.map((o) => o.trim()).filter(Boolean),
        title: draft.title.trim(),
        premise: draft.premise.trim(),
        chat_name: draft.chat_name.trim(),
        explanation: draft.explanation.trim(),
      };
      const result = await createDailyPuzzle(payload);
      setPublishSuccess(result);
    } catch (e) {
      setPublishError(e instanceof Error ? e.message : "Failed to save puzzle");
    } finally {
      setPublishing(false);
    }
  };

  const previewPuzzle = draftToPuzzle(draft);

  return (
    <Box
      style={{
        minHeight: "100vh",
        background: "#e5e5ea",
        padding: "16px 0",
      }}
    >
      <Group align="flex-start" gap={24} wrap="wrap" maw={1200} mx="auto" style={{ alignItems: "flex-start" }}>
        <Paper
          p={20}
          radius="lg"
          shadow="sm"
          bg="white"
          style={{
            flex: "1 1 400px",
            minWidth: 0,
            maxHeight: "calc(100vh - 48px)",
            overflowY: "auto",
          }}
        >
          <Title order={1} size="h4" fw={700} mb={16}>
            Create daily puzzle
          </Title>
          <Text size="sm" c="dimmed" mb={20}>
            Edit below; preview updates live. When ready, set the release date and publish.
          </Text>

          <Stack gap={16}>
            <TextInput
              label="Title"
              placeholder="e.g. The Surprise"
              value={draft.title}
              onChange={(e) => update("title", e.target.value)}
              radius="sm"
              styles={{ label: { fontSize: 13, fontWeight: 600 } }}
            />
            <TextInput
              label="Chat name"
              placeholder="e.g. Maya's Bday"
              value={draft.chat_name}
              onChange={(e) => update("chat_name", e.target.value)}
              radius="sm"
              styles={{ label: { fontSize: 13, fontWeight: 600 } }}
            />
            <Textarea
              label="Premise"
              placeholder="e.g. You're reading a group chat..."
              value={draft.premise}
              onChange={(e) => update("premise", e.target.value)}
              rows={3}
              radius="sm"
              styles={{ label: { fontSize: 13, fontWeight: 600 } }}
            />
            <Checkbox
              label="Group chat"
              checked={draft.is_group}
              onChange={(e) => update("is_group", e.target.checked)}
              size="sm"
            />
            <TextInput
              label="Release date"
              type="date"
              value={draft.date}
              onChange={(e) => update("date", e.target.value)}
              radius="sm"
              styles={{ label: { fontSize: 13, fontWeight: 600 } }}
            />
          </Stack>

          <Title order={2} size="h5" fw={600} mt={24} mb={8}>
            Messages
          </Title>
          <Stack gap={10}>
            {draft.messages.map((msg, i) => (
              <Paper key={msg.id} p={12} radius="sm" withBorder style={{ borderColor: "#e5e5ea" }}>
                <Stack gap={6}>
                  <Group justify="space-between" align="center">
                    <Text size="xs" c="dimmed">Message {i + 1}</Text>
                    <Group gap={4}>
                      <Button
                        variant="subtle"
                        size="compact-xs"
                        onClick={() => moveMessage(i, "up")}
                        disabled={i === 0}
                      >
                        Up
                      </Button>
                      <Button
                        variant="subtle"
                        size="compact-xs"
                        onClick={() => moveMessage(i, "down")}
                        disabled={i === draft.messages.length - 1}
                      >
                        Down
                      </Button>
                      <Button
                        variant="subtle"
                        size="compact-xs"
                        color="red"
                        onClick={() => removeMessage(i)}
                        disabled={draft.messages.length <= MIN_MESSAGES}
                      >
                        Remove
                      </Button>
                    </Group>
                  </Group>
                  <TextInput
                    placeholder="Sender name"
                    value={msg.sender}
                    onChange={(e) => updateMessage(i, "sender", e.target.value)}
                    size="sm"
                    radius="xs"
                  />
                  <Textarea
                    placeholder="Message text"
                    value={msg.text}
                    onChange={(e) => updateMessage(i, "text", e.target.value)}
                    rows={2}
                    size="sm"
                    radius="xs"
                    styles={{ input: { resize: "vertical" } }}
                  />
                  <Group align="center" gap={8}>
                    <TextInput
                      placeholder="12:00 PM"
                      value={msg.timestamp}
                      onChange={(e) => updateMessage(i, "timestamp", e.target.value)}
                      size="xs"
                      w={80}
                      radius="xs"
                    />
                    <Checkbox
                      label="Show timestamp"
                      size="xs"
                      checked={msg.show_timestamp}
                      onChange={(e) => updateMessage(i, "show_timestamp", e.target.checked)}
                    />
                  </Group>
                </Stack>
              </Paper>
            ))}
            <Button
              variant="default"
              onClick={addMessage}
              disabled={draft.messages.length >= MAX_MESSAGES}
              radius="sm"
              style={{ borderStyle: "dashed", borderColor: "#d1d1d6", background: "#f9f9f9" }}
            >
              + Add message
            </Button>
          </Stack>

          <Title order={2} size="h5" fw={600} mt={24} mb={8}>
            Answer options
          </Title>
          <Text size="xs" c="dimmed" mb={8}>
            The three names players choose from. One must be correct.
          </Text>
          <Radio.Group
            value={String(draft.correct_option_index)}
            onChange={(v) => update("correct_option_index", parseInt(v, 10))}
          >
            <Stack gap={8}>
              {draft.options.map((opt, i) => (
                <Group key={i} align="center" gap={8}>
                  <Text size="sm" fw={600} w={24}>{["A", "B", "C"][i]}</Text>
                  <TextInput
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={(e) => {
                      const next = [...draft.options];
                      next[i] = e.target.value;
                      update("options", next);
                    }}
                    radius="sm"
                    style={{ flex: 1 }}
                  />
                  <Radio value={String(i)} label="Correct" size="xs" />
                </Group>
              ))}
            </Stack>
          </Radio.Group>

          <Textarea
            label="Explanation (shown after submit)"
            placeholder="Why this answer is correct..."
            value={draft.explanation}
            onChange={(e) => update("explanation", e.target.value)}
            rows={4}
            radius="sm"
            mt={20}
            styles={{ label: { fontSize: 13, fontWeight: 600 }, input: { resize: "vertical" } }}
          />

          {publishError && (
            <Alert color="red" variant="light" mt={16} radius="sm">
              {publishError}
            </Alert>
          )}
          {publishSuccess && (
            <Alert color="green" variant="light" mt={16} radius="sm">
              <Text fw={600} size="sm">Puzzle saved</Text>
              <Text size="xs" mt={4}>
                Release date: {publishSuccess.date}. Id: {publishSuccess.id}. It will appear on the home page when that date is today.
              </Text>
            </Alert>
          )}
          <Group gap={12} mt={24} wrap="wrap">
            <Button variant="filled" radius="md" size="md" fw={600} loading={publishing} onClick={handlePublish}>
              {publishing ? "Saving…" : "Publish to database"}
            </Button>
            <Button component={Link} to="/" variant="subtle" size="md" c="primary">
              Back to today&apos;s puzzle
            </Button>
          </Group>
        </Paper>

        <Paper
          radius="lg"
          shadow="md"
          bg="white"
          style={{
            flex: "0 0 auto",
            width: "100%",
            maxWidth: 430,
            height: "min(700px, calc(100vh - 48px))",
            overflow: "auto",
          }}
        >
          <DailyPuzzleView puzzle={previewPuzzle} subtitle="Preview" />
        </Paper>
      </Group>
    </Box>
  );
}
