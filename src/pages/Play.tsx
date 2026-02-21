import { useState, useRef, useEffect } from "react";
import type { Puzzle } from "../types/puzzle";
import { shuffle } from "../data/puzzles";
import { ArrowUpIcon, ArrowDownIcon } from "../components/Icons";
import { StrikeIndicator } from "../components/StrikeIndicator";
import { HintIcon } from "../components/HintIcon";
import { Box, Stack, Group, Text, Title, Button, Paper } from "@mantine/core";

function ShareResultButton({ timeSeconds }: { timeSeconds: number }) {
  const [copied, setCopied] = useState(false);
  const text = `I got today's re:chat in ${formatTime(timeSeconds)}. Can you beat it?`;
  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };
  return (
    <Button
      type="button"
      variant="subtle"
      size="sm"
      color="primary"
      onClick={handleClick}
      mt="xs"
      style={{ textDecoration: copied ? "none" : "underline" }}
    >
      {copied ? "Copied!" : "Share your result"}
    </Button>
  );
}

const HINT_TIMEOUT_1 = 45;
const HINT_TIMEOUT_2 = 90;
const HINT_TIMEOUT_3 = 120;
const MAX_STRIKES = 3;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}:${s.toString().padStart(2, "0")}` : `0:${s.toString().padStart(2, "0")}`;
}

export interface DailyPersistedState {
  date: string;
  messageOrder: string[];
  strikes: number;
  isSolved: boolean;
  gameOver: boolean;
  timeElapsed: number;
}

interface PlayProps {
  previewPuzzle: Puzzle;
  onSolved?: () => void;
  hideHeader?: boolean;
  hideSuccessMessage?: boolean;
  /** When provided, use this as initial order instead of shuffling (e.g. from daily API) */
  initialOrder?: string[];
  /** Daily mode: no Reset/Try again, partial feedback on wrong check, persist state */
  dailyMode?: boolean;
  /** Restore from previous session (daily mode only) */
  persistedState?: DailyPersistedState | null;
  /** Called when state changes so parent can persist to localStorage (daily mode only) */
  onPersist?: (state: DailyPersistedState) => void;
}

export function Play({
  previewPuzzle,
  onSolved,
  hideHeader,
  hideSuccessMessage,
  initialOrder,
  dailyMode,
  persistedState,
  onPersist,
}: PlayProps) {
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);
  const [messageOrder, setMessageOrder] = useState<string[]>([]);
  const [isSolved, setIsSolved] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [strikes, setStrikes] = useState(0);
  const [showShake, setShowShake] = useState(false);
  const [lastCorrectCount, setLastCorrectCount] = useState<number | null>(null);
  const [hintTier, setHintTier] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [wrongChecks, setWrongChecks] = useState(0);
  const [userHasOpenedHint, setUserHasOpenedHint] = useState(false);
  const draggedIndexRef = useRef<number | null>(null);
  const timeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadPuzzle = (puzzle: Puzzle, order?: string[]) => {
    setCurrentPuzzle(puzzle);
    setMessageOrder(order ?? shuffle(puzzle.correctOrder));
    setIsSolved(false);
    setGameOver(false);
    setStrikes(0);
    setShowShake(false);
    setLastCorrectCount(null);
    setHintTier(0);
    setWrongChecks(0);
    setTimeElapsed(0);
  };

  useEffect(() => {
    const canRestore =
      dailyMode &&
      persistedState?.date &&
      persistedState.messageOrder.length > 0 &&
      persistedState.messageOrder.length === previewPuzzle.correctOrder.length;
    if (canRestore) {
      setCurrentPuzzle(previewPuzzle);
      setMessageOrder(persistedState.messageOrder);
      setIsSolved(persistedState.isSolved);
      setGameOver(persistedState.gameOver);
      setStrikes(persistedState.strikes);
      setTimeElapsed(persistedState.timeElapsed);
      setShowShake(false);
      setLastCorrectCount(null);
      return;
    }
    loadPuzzle(previewPuzzle, initialOrder);
  }, [previewPuzzle.id, dailyMode, persistedState?.date ?? ""]);

  useEffect(() => {
    if (!dailyMode || !onPersist || !currentPuzzle) return;
    if (messageOrder.length !== currentPuzzle.correctOrder.length) return;
    onPersist({
      date: persistedState?.date ?? "",
      messageOrder,
      strikes,
      isSolved,
      gameOver,
      timeElapsed,
    });
  }, [dailyMode, messageOrder, strikes, isSolved, gameOver, timeElapsed]);

  useEffect(() => {
    if (isSolved && onSolved) onSolved();
  }, [isSolved, onSolved]);

  useEffect(() => {
    if (isSolved || gameOver) {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
        timeIntervalRef.current = null;
      }
      return;
    }
    timeIntervalRef.current = setInterval(() => {
      setTimeElapsed((t) => t + 1);
    }, 1000);
    return () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
    };
  }, [isSolved, gameOver]);

  useEffect(() => {
    if (wrongChecks >= 1 || timeElapsed >= HINT_TIMEOUT_1) {
      setHintTier((prev) => Math.max(prev, 1));
    }
    if (wrongChecks >= 2 || timeElapsed >= HINT_TIMEOUT_2) {
      setHintTier((prev) => Math.max(prev, 2));
    }
    if (wrongChecks >= 3 || timeElapsed >= HINT_TIMEOUT_3) {
      setHintTier((prev) => Math.max(prev, 3));
    }
  }, [wrongChecks, timeElapsed]);

  const handleReset = () => {
    if (!currentPuzzle) return;
    setMessageOrder(shuffle(currentPuzzle.correctOrder));
    setIsSolved(false);
    setGameOver(false);
    setStrikes(0);
    setShowShake(false);
  };


  const handleTryAgain = () => {
    if (!currentPuzzle) return;
    setMessageOrder(shuffle(currentPuzzle.correctOrder));
    setIsSolved(false);
    setGameOver(false);
    setStrikes(0);
    setShowShake(false);
    setHintTier(0);
    setWrongChecks(0);
    setTimeElapsed(0);
  };

  const handleCheck = () => {
    if (!currentPuzzle || isSolved || gameOver) return;
    const correct = currentPuzzle.correctOrder.every(
      (id, i) => id === messageOrder[i]
    );
    if (correct) {
      setLastCorrectCount(null);
      setIsSolved(true);
    } else {
      const correctPositionCount = messageOrder.filter(
        (id, i) => id === currentPuzzle.correctOrder[i]
      ).length;
      setLastCorrectCount(correctPositionCount);
      setWrongChecks((c) => c + 1);
      setStrikes((s) => {
        const next = s + 1;
        if (next >= MAX_STRIKES) setGameOver(true);
        return next;
      });
      setShowShake(true);
      setTimeout(() => setShowShake(false), 500);
    }
  };

  const revealHint = () => {
    if (hintTier < 3 && currentPuzzle && currentPuzzle.constraints.length > hintTier) {
      setHintTier((prev) => Math.min(prev + 1, 3));
    }
  };

  const moveMessage = (index: number, direction: "up" | "down") => {
    if (isSolved || gameOver) return;
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= messageOrder.length) return;
    setMessageOrder((prev) => {
      const next = [...prev];
      [next[index], next[newIndex]] = [next[newIndex], next[index]];
      return next;
    });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (isSolved || gameOver) return;
    draggedIndexRef.current = index;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
    const target = e.currentTarget as HTMLElement;
    const bubble = target.querySelector("[data-bubble]") as HTMLElement;
    if (bubble) bubble.style.opacity = "0.6";
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    const bubble = target.querySelector("[data-bubble]") as HTMLElement;
    if (bubble) bubble.style.opacity = "1";
    draggedIndexRef.current = null;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = draggedIndexRef.current;
    if (
      dragIndex === null ||
      dragIndex === dropIndex ||
      isSolved ||
      gameOver
    )
      return;
    setMessageOrder((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(dropIndex, 0, moved);
      return next;
    });
    draggedIndexRef.current = null;
  };

  const showHintButton =
    !dailyMode &&
    !isSolved &&
    !gameOver &&
    currentPuzzle &&
    currentPuzzle.constraints.length > 0 &&
    (wrongChecks >= 1 || timeElapsed >= HINT_TIMEOUT_1);

  const effectiveHintTier = hintTier;
  const visibleConstraints =
    currentPuzzle && effectiveHintTier > 0
      ? currentPuzzle.constraints.slice(0, effectiveHintTier)
      : [];

  const allHintsShown =
    currentPuzzle && effectiveHintTier >= currentPuzzle.constraints.length;

  const displayOrder = messageOrder;
  const canReorder = !isSolved && !gameOver;

  if (!currentPuzzle) return null;

  return (
    <Box
      className="animate-fade-in"
      w="100%"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: hideHeader ? 0 : "24px 16px",
        minHeight: hideHeader ? "auto" : "100vh",
        justifyContent: hideHeader ? "flex-start" : "center",
      }}
    >
      <Box w="100%" maw={600} mx="auto">
        <Group
          justify={hideHeader ? "flex-end" : "space-between"}
          align="flex-start"
          gap="md"
          mb="md"
          wrap="wrap"
        >
          {!hideHeader && (
            <Box>
              <Title order={1} size="h2" fw={500} mb={4}>re:chat</Title>
              <Text size="sm" c="dimmed">Put the messages in order.</Text>
            </Box>
          )}
          <Group justify="space-between" align="center" style={hideHeader ? { width: "100%" } : { flex: 1, minWidth: 0 }}>
            <Group gap="sm">
              <StrikeIndicator strikes={strikes} />
              {dailyMode && !isSolved && !gameOver && (
                <Text size="sm" c="dimmed" style={{ fontVariantNumeric: "tabular-nums" }} aria-label={`Time: ${formatTime(timeElapsed)}`}>
                  {formatTime(timeElapsed)}
                </Text>
              )}
            </Group>
            {showHintButton ? (
              <HintIcon
                hints={visibleConstraints}
                onRevealMore={!allHintsShown ? revealHint : undefined}
                isHighlighted={!userHasOpenedHint}
                onOpen={() => setUserHasOpenedHint(true)}
              />
            ) : (
              <Box w={44} h={44} style={{ flexShrink: 0 }} aria-hidden />
            )}
          </Group>
        </Group>

        {!hideHeader && (
          <Text size="sm" c="dimmed" mb="sm">
            Drag or use arrows to reorder. Put the conversation in chronological order.
          </Text>
        )}

        <Box
          component="ul"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: hideHeader ? 8 : 12,
            marginBottom: hideHeader ? 16 : 24,
            minHeight: hideHeader ? 140 : 200,
            padding: 8,
            margin: -8,
            borderRadius: 12,
            transition: "all 0.2s",
            ...(isSolved ? { outline: "2px solid var(--mantine-color-green-4)", outlineOffset: 2, backgroundColor: "rgba(134, 239, 172, 0.3)" } : {}),
            ...(gameOver ? { outline: "2px solid var(--mantine-color-red-4)", outlineOffset: 2, backgroundColor: "rgba(254, 202, 202, 0.3)" } : {}),
          }}
        >
          {displayOrder.map((id, index) => {
            const msg = currentPuzzle.messages.find((m) => m.id === id);
            if (!msg) return null;
            const isSent = msg.speaker === "A";
            return (
              <Box
                component="li"
                key={id}
                draggable={canReorder}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  cursor: canReorder ? "grab" : "default",
                  justifyContent: isSent ? "flex-end" : "flex-start",
                }}
              >
                {canReorder && (
                  <Group gap={2} style={{ flexShrink: 0, opacity: 0.6 }}>
                    <Button
                      variant="subtle"
                      type="button"
                      onClick={() => moveMessage(index, "up")}
                      disabled={index === 0}
                      aria-label="Move up"
                      p="xs"
                      style={{ minHeight: 44, minWidth: 44, touchAction: "manipulation" }}
                      styles={{ inner: { justifyContent: "center", alignItems: "center" } }}
                    >
                      <ArrowUpIcon />
                    </Button>
                    <Button
                      variant="subtle"
                      type="button"
                      onClick={() => moveMessage(index, "down")}
                      disabled={index === messageOrder.length - 1}
                      aria-label="Move down"
                      p="xs"
                      style={{ minHeight: 44, minWidth: 44, touchAction: "manipulation" }}
                      styles={{ inner: { justifyContent: "center", alignItems: "center" } }}
                    >
                      <ArrowDownIcon />
                    </Button>
                  </Group>
                )}
                <Box
                  data-bubble
                  style={{
                    flexShrink: 0,
                    maxWidth: "85%",
                    padding: "12px 16px",
                    borderRadius: 16,
                    fontSize: 15,
                    lineHeight: 1.5,
                    transition: "all 0.2s",
                    ...(isSent
                      ? { borderBottomRightRadius: 4, background: "#007AFF", color: "white" }
                      : { borderBottomLeftRadius: 4, background: "#E5E5EA", color: "#111" }),
                  }}
                >
                  {msg.text}
                </Box>
              </Box>
            );
          })}
        </Box>

        {isSolved && !hideSuccessMessage && (
          <Stack align="center" gap={4} mb="md">
            <Text size="sm" fw={600} c="green">
              You got it{timeElapsed > 0 ? ` in ${formatTime(timeElapsed)}` : ""}.
            </Text>
            {dailyMode && (
              <>
                <Text size="sm" c="dimmed">See you tomorrow.</Text>
                <ShareResultButton timeSeconds={timeElapsed} />
              </>
            )}
          </Stack>
        )}

        {gameOver && (
          <Stack align="center" gap="sm" mb="md">
            <Text size="sm" fw={600} c="red">
              {dailyMode ? "You're out for today." : "Out! 3 strikes."}
            </Text>
            {dailyMode && (
              <Text size="sm" c="dimmed">See you tomorrow for a new puzzle.</Text>
            )}
            {dailyMode && currentPuzzle && (
              <Paper radius="lg" p="md" withBorder style={{ width: "100%", textAlign: "left", backgroundColor: "#f9fafb" }} mb="md">
                <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb="xs">
                  Correct order
                </Text>
                <Stack gap="xs">
                  {currentPuzzle.correctOrder.map((id) => {
                    const msg = currentPuzzle.messages.find((m) => m.id === id);
                    if (!msg) return null;
                    const isSent = msg.speaker === "A";
                    return (
                      <Box
                        key={id}
                        component="div"
                        style={{
                          display: "flex",
                          justifyContent: isSent ? "flex-end" : "flex-start",
                        }}
                      >
                        <Box
                          component="span"
                          style={{
                            display: "inline-block",
                            maxWidth: "85%",
                            padding: "8px 16px",
                            borderRadius: 16,
                            fontSize: 14,
                            ...(isSent
                              ? { borderBottomRightRadius: 4, background: "#007AFF", color: "white" }
                              : { borderBottomLeftRadius: 4, background: "#E5E5EA", color: "#111" }),
                          }}
                        >
                          {msg.text}
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              </Paper>
            )}
            {!dailyMode && (
              <Button
                variant="filled"
                color="dark"
                size="md"
                fw={500}
                onClick={handleTryAgain}
                style={{ minHeight: 44, touchAction: "manipulation" }}
              >
                Try again
              </Button>
            )}
          </Stack>
        )}

        {!gameOver && (
          <Stack
            gap="md"
            className={showShake ? "animate-shake" : ""}
          >
            {showShake && (
              <Text size="sm" fw={600} c="red" ta="center">
                {dailyMode && lastCorrectCount !== null
                  ? `Not quite — ${lastCorrectCount} of ${currentPuzzle!.correctOrder.length} in correct position. Use that to narrow it down.`
                  : "Wrong order. Try again."}
              </Text>
            )}
            <Group gap="md" wrap="wrap">
              <Button
                variant="filled"
                color="dark"
                size="md"
                fw={500}
                onClick={handleCheck}
                disabled={isSolved}
                style={{ minHeight: 44, touchAction: "manipulation" }}
              >
                Check Answer
              </Button>
              {!dailyMode && (
                <Button
                  variant="outline"
                  color="gray"
                  size="md"
                  fw={500}
                  onClick={handleReset}
                  disabled={isSolved}
                  style={{ minHeight: 44, touchAction: "manipulation" }}
                >
                  Reset
                </Button>
              )}
            </Group>
          </Stack>
        )}
      </Box>
    </Box>
  );
}
