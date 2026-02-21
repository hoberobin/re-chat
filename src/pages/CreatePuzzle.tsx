import { useState, useCallback, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import type { Message } from "../types/puzzle";
import { parseChatText } from "../utils/parseChatText";
import { createPuzzle } from "../api/puzzles";
import { useScreenshotOCR } from "../hooks/useScreenshotOCR";
import { Play } from "./Play";
import { ArrowUpIcon, ArrowDownIcon } from "../components/Icons";
import {
  Box,
  Stack,
  Group,
  Title,
  Text,
  TextInput,
  Button,
  Select,
  Paper,
  Alert,
} from "@mantine/core";

const MIN_MESSAGES = 2;
const MAX_MESSAGES = 30;

function messagesToOrder(msgs: Message[]): string[] {
  return msgs.map((m) => m.id);
}

function parsedToMessages(parsed: { speaker: string; text: string }[]): Message[] {
  return parsed.map((p, i) => ({
    id: `m${i + 1}`,
    speaker: p.speaker,
    text: p.text,
  }));
}

const blankMessage = (i: number): Message => ({
  id: `m${i + 1}`,
  speaker: i % 2 === 0 ? "A" : "B",
  text: "",
});

type Step = 1 | 2 | 3;
type InputMode = "screenshot" | "manual";

export function CreatePuzzle() {
  const [step, setStep] = useState<Step>(1);
  const [inputMode, setInputMode] = useState<InputMode>("screenshot");
  const [messages, setMessages] = useState<Message[]>([]);
  const [correctOrder, setCorrectOrder] = useState<string[]>([]);
  const [constraints, setConstraints] = useState<string[]>([""]);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishedId, setPublishedId] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [preview, setPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { extractText, loading: ocrLoading, error: ocrError } = useScreenshotOCR();

  useEffect(() => {
    if (inputMode === "manual" && messages.length < MIN_MESSAGES) {
      const blanks = Array.from({ length: MIN_MESSAGES }, (_, i) => blankMessage(i));
      setMessages(blanks);
      setCorrectOrder(messagesToOrder(blanks));
    }
  }, [inputMode]);

  const updateMessage = useCallback((index: number, field: keyof Message, value: string) => {
    setMessages((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }, []);

  const addMessage = useCallback(() => {
    if (messages.length >= MAX_MESSAGES) return;
    const n = messages.length + 1;
    setMessages((prev) => [...prev, blankMessage(prev.length)]);
    setCorrectOrder((prev) => [...prev, `m${n}`]);
  }, [messages.length]);

  const removeMessage = useCallback((index: number) => {
    if (messages.length <= MIN_MESSAGES) return;
    const id = messages[index].id;
    setMessages((prev) => prev.filter((_, i) => i !== index));
    setCorrectOrder((prev) => prev.filter((x) => x !== id));
  }, [messages.length]);

  const moveInOrder = useCallback((index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= correctOrder.length) return;
    setCorrectOrder((prev) => {
      const next = [...prev];
      [next[index], next[newIndex]] = [next[newIndex], next[index]];
      return next;
    });
  }, [correctOrder.length]);

  const updateConstraint = useCallback((index: number, value: string) => {
    setConstraints((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const addConstraint = useCallback(() => setConstraints((p) => [...p, ""]), []);

  const handleScreenshotFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) return;
      try {
        const text = await extractText(file);
        const parsed = parseChatText(text);
        if (parsed.length >= MIN_MESSAGES) {
          const clamped = parsed.slice(0, MAX_MESSAGES);
          const msgs = parsedToMessages(clamped);
          setMessages(msgs);
          setCorrectOrder(messagesToOrder(msgs));
        } else if (parsed.length > 0) {
          const msgs = parsedToMessages(parsed);
          setMessages(msgs);
          setCorrectOrder(messagesToOrder(msgs));
        }
      } catch {
        // Error already set in hook
      }
    },
    [extractText]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleScreenshotFile(file);
    },
    [handleScreenshotFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleScreenshotFile(file);
      e.target.value = "";
    },
    [handleScreenshotFile]
  );

  const removeConstraint = useCallback((index: number) => {
    if (constraints.length <= 1) return;
    setConstraints((prev) => prev.filter((_, i) => i !== index));
  }, [constraints.length]);

  const hintList = constraints.filter(Boolean);
  const canProceedStep1 = messages.length >= MIN_MESSAGES && messages.every((m) => m.text.trim());
  const canPublish = canProceedStep1;

  const handlePublish = async () => {
    if (!canPublish) return;
    setIsPublishing(true);
    setPublishError(null);
    try {
      const { id } = await createPuzzle({
        messages,
        correctOrder,
        constraints: hintList,
      });
      setPublishedId(id);
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : "Failed to publish");
    } finally {
      setIsPublishing(false);
    }
  };

  const puzzle = {
    id: "preview",
    messages,
    correctOrder,
    constraints: hintList,
  };

  if (preview) {
    return (
      <Box w="100%" maw={600} mx="auto" px="md" py="md">
        <Button variant="subtle" size="sm" color="gray" mb="sm" onClick={() => setPreview(false)}>
          Back to creator
        </Button>
        <Play previewPuzzle={puzzle} />
      </Box>
    );
  }

  return (
    <Box w="100%" maw={600} mx="auto" px="md" py="md">
      <Group justify="space-between" align="center" mb="lg">
        <Title order={1} size="h3" fw={500}>
          Create re:chat
        </Title>
        <Button component={Link} to="/" variant="subtle" size="sm" color="gray">
          Back home
        </Button>
      </Group>

      <Group gap="xs" mb="lg">
        {([1, 2, 3] as Step[]).map((s) => (
          <Box
            key={s}
            style={{
              height: 4,
              flex: 1,
              borderRadius: 9999,
              backgroundColor: s <= step ? "#111827" : "#e5e7eb",
            }}
          />
        ))}
      </Group>

      {step === 1 && (
        <Stack gap="md">
          <Text size="sm" fw={500} c="dimmed">
            Add your chat
          </Text>
          <Group gap="xs">
            <Button
              variant={inputMode === "screenshot" ? "filled" : "light"}
              color="dark"
              size="sm"
              radius="md"
              onClick={() => setInputMode("screenshot")}
            >
              Screenshot
            </Button>
            <Button
              variant={inputMode === "manual" ? "filled" : "light"}
              color="dark"
              size="sm"
              radius="md"
              onClick={() => setInputMode("manual")}
            >
              Add manually
            </Button>
          </Group>

          {inputMode === "screenshot" && (
            <Stack gap="sm">
              <Paper
                radius="lg"
                p="xl"
                ta="center"
                onDrop={(e) => !ocrLoading && handleDrop(e)}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => !ocrLoading && fileInputRef.current?.click()}
                style={{
                  border: "2px dashed",
                  borderColor: ocrLoading ? "#e5e7eb" : "#d1d5db",
                  backgroundColor: ocrLoading ? "#f9fafb" : "transparent",
                  cursor: ocrLoading ? "wait" : "pointer",
                  transition: "all 0.2s",
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  disabled={ocrLoading}
                  style={{ display: "none" }}
                />
                {ocrLoading ? (
                  <Text size="sm" c="dimmed">Reading your screenshot…</Text>
                ) : (
                  <Stack gap={4}>
                    <Text size="sm" c="dimmed">Drop a screenshot or tap to upload</Text>
                    <Text size="xs" c="dimmed">Works with chat screenshots from iMessage, WhatsApp, etc.</Text>
                  </Stack>
                )}
              </Paper>
              {ocrError && (
                <Text size="sm" c="red">
                  {ocrError}. Try pasting text or adding manually.
                </Text>
              )}
              {messages.length > 0 && (
                <Stack gap="xs">
                  <Text size="xs" c="dimmed">Parsed messages – edit if needed:</Text>
                  {messages.map((msg, i) => (
                    <Group key={msg.id} gap="xs" align="center">
                      <Select
                        value={msg.speaker}
                        onChange={(v) => updateMessage(i, "speaker", v ?? "A")}
                        data={["A", "B"]}
                        size="sm"
                        w={80}
                        radius="md"
                      />
                      <TextInput
                        value={msg.text}
                        onChange={(e) => updateMessage(i, "text", e.target.value)}
                        size="sm"
                        radius="md"
                        style={{ flex: 1 }}
                      />
                      <Button
                        variant="subtle"
                        color="red"
                        size="sm"
                        onClick={() => removeMessage(i)}
                        disabled={messages.length <= MIN_MESSAGES}
                      >
                        Remove
                      </Button>
                    </Group>
                  ))}
                </Stack>
              )}
              <Text size="xs" c="dimmed">
                Looks wrong? Edit above or{" "}
                <Button variant="subtle" size="xs" onClick={() => setInputMode("manual")} style={{ display: "inline", verticalAlign: "baseline" }}>
                  add manually
                </Button>{" "}
                instead.
              </Text>
            </Stack>
          )}

          {inputMode === "manual" && (
            <Stack gap="sm">
              {messages.map((msg, i) => (
                <Group key={msg.id} gap="xs" align="center">
                  <Select
                    value={msg.speaker}
                    onChange={(v) => updateMessage(i, "speaker", v ?? "A")}
                    data={["A", "B"]}
                    size="sm"
                    w={80}
                    radius="md"
                  />
                  <TextInput
                    value={msg.text}
                    onChange={(e) => updateMessage(i, "text", e.target.value)}
                    placeholder="Message text"
                    size="sm"
                    radius="md"
                    style={{ flex: 1 }}
                  />
                  <Button
                    variant="subtle"
                    color="red"
                    size="sm"
                    onClick={() => removeMessage(i)}
                    disabled={messages.length <= MIN_MESSAGES}
                  >
                    Remove
                  </Button>
                </Group>
              ))}
              <Button
                variant="subtle"
                size="sm"
                color="gray"
                onClick={addMessage}
                disabled={messages.length >= MAX_MESSAGES}
              >
                + Add message
              </Button>
            </Stack>
          )}

          <Button
            variant="filled"
            color="dark"
            size="md"
            fw={500}
            radius="lg"
            disabled={!canProceedStep1}
            onClick={() => setStep(2)}
            style={{ minHeight: 44 }}
          >
            Continue
          </Button>
        </Stack>
      )}

      {step === 2 && (
        <Stack gap="md">
          <Text size="sm" fw={500} c="dimmed">
            Confirm or reorder – this is the order solvers must find
          </Text>
          <Stack gap="xs" mb="lg">
            {correctOrder.map((id, i) => {
              const msg = messages.find((m) => m.id === id);
              if (!msg) return null;
              const isSent = msg.speaker === "A";
              return (
                <Group key={id} gap="xs" justify={isSent ? "flex-end" : "flex-start"}>
                  <Group gap={2}>
                    <Button
                      variant="subtle"
                      size="xs"
                      onClick={() => moveInOrder(i, "up")}
                      disabled={i === 0}
                      styles={{ inner: { justifyContent: "center", alignItems: "center" } }}
                    >
                      <ArrowUpIcon />
                    </Button>
                    <Button
                      variant="subtle"
                      size="xs"
                      onClick={() => moveInOrder(i, "down")}
                      disabled={i === correctOrder.length - 1}
                      styles={{ inner: { justifyContent: "center", alignItems: "center" } }}
                    >
                      <ArrowDownIcon />
                    </Button>
                  </Group>
                  <Box
                    style={{
                      maxWidth: "85%",
                      padding: "12px 16px",
                      borderRadius: 16,
                      fontSize: 15,
                      ...(isSent
                        ? { borderBottomRightRadius: 4, background: "#007AFF", color: "white" }
                        : { borderBottomLeftRadius: 4, background: "#E5E5EA", color: "#111" }),
                    }}
                  >
                    {msg.text}
                  </Box>
                </Group>
              );
            })}
          </Stack>
          <Group gap="md">
            <Button
              variant="outline"
              color="gray"
              size="md"
              fw={500}
              radius="lg"
              onClick={() => setStep(1)}
              style={{ minHeight: 44 }}
            >
              Back
            </Button>
            <Button
              variant="filled"
              color="dark"
              size="md"
              fw={500}
              radius="lg"
              onClick={() => setStep(3)}
              style={{ minHeight: 44 }}
            >
              Continue
            </Button>
          </Group>
        </Stack>
      )}

      {step === 3 && (
        <Stack gap="md">
          <Text size="sm" fw={500} c="dimmed">
            Hints (optional)
          </Text>
          <Text size="xs" c="dimmed" mb="xs">
            Add hints to help solvers.
          </Text>
          <Stack gap="xs" mb="lg">
            {constraints.map((c, i) => (
              <Group key={i} gap="xs">
                <TextInput
                  value={c}
                  onChange={(e) => updateConstraint(i, e.target.value)}
                  placeholder={`Hint ${i + 1}`}
                  size="sm"
                  radius="md"
                  style={{ flex: 1 }}
                />
                <Button
                  variant="subtle"
                  color="red"
                  size="sm"
                  onClick={() => removeConstraint(i)}
                  disabled={constraints.length <= 1}
                >
                  Remove
                </Button>
              </Group>
            ))}
            <Button variant="subtle" size="sm" color="gray" onClick={addConstraint}>
              + Add hint
            </Button>
          </Stack>

          {!publishedId ? (
            <>
              {publishError && (
                <Alert color="red" variant="light" mb="md">
                  {publishError}
                </Alert>
              )}
              <Group gap="md">
                <Button
                  variant="outline"
                  color="gray"
                  size="md"
                  fw={500}
                  radius="lg"
                  onClick={() => setStep(2)}
                  style={{ minHeight: 44 }}
                >
                  Back
                </Button>
                <Button
                  variant="outline"
                  color="gray"
                  size="md"
                  fw={500}
                  radius="lg"
                  onClick={() => setPreview(true)}
                  style={{ minHeight: 44 }}
                >
                  Preview
                </Button>
                <Button
                  variant="filled"
                  color="dark"
                  size="md"
                  fw={500}
                  radius="lg"
                  loading={isPublishing}
                  disabled={!canPublish}
                  onClick={handlePublish}
                  style={{ minHeight: 44 }}
                >
                  {isPublishing ? "Publishing…" : "Create & get link"}
                </Button>
              </Group>
            </>
          ) : (
            <Paper radius="lg" withBorder p="lg" shadow="sm">
              <Text fw={500} mb={4}>Your re:chat is ready</Text>
              <Text size="sm" c="dimmed" mb="md">
                Share the link or embed it.
              </Text>
              <ShareBlock id={publishedId} />
            </Paper>
          )}
        </Stack>
      )}
    </Box>
  );
}

function ShareBlock({ id }: { id: string }) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/p/${id}` : "";
  const embedUrl = typeof window !== "undefined" ? `${window.location.origin}/embed/${id}` : "";
  const embedCode = `<iframe src="${embedUrl}" width="400" height="500" frameborder="0"></iframe>`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  return (
    <Stack gap="md">
      <Box>
        <Text size="xs" fw={500} c="dimmed" mb="xs" component="label">
          Share link
        </Text>
        <Group gap="xs">
          <TextInput
            value={shareUrl}
            readOnly
            size="sm"
            radius="lg"
            style={{ flex: 1 }}
            styles={{ input: { backgroundColor: "#f9fafb" } }}
          />
          <Button
            variant="filled"
            color="primary"
            size="sm"
            radius="lg"
            onClick={copyLink}
          >
            {copiedLink ? "Copied!" : "Copy"}
          </Button>
        </Group>
      </Box>
      <Box>
        <Text size="xs" fw={500} c="dimmed" mb="xs" component="label">
          Embed code
        </Text>
        <Group gap="xs">
          <TextInput
            value={embedCode}
            readOnly
            size="xs"
            radius="lg"
            style={{ flex: 1, fontFamily: "monospace" }}
            styles={{ input: { backgroundColor: "#f9fafb" } }}
          />
          <Button
            variant="filled"
            color="primary"
            size="sm"
            radius="lg"
            onClick={copyEmbed}
          >
            {copiedEmbed ? "Copied!" : "Copy"}
          </Button>
        </Group>
      </Box>
      <Button component={Link} to={`/p/${id}`} variant="subtle" size="sm" color="primary">
        Open puzzle →
      </Button>
    </Stack>
  );
}
