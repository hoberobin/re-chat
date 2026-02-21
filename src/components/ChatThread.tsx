import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestionCircle } from "@fortawesome/free-solid-svg-icons";
import type { ChatMessage } from "../types/puzzle";
import { getSenderColor, getOrderedSenders } from "../utils/chatColors";
import { Box, Group, Stack, Text, Button, Paper } from "@mantine/core";

interface ChatThreadHeaderProps {
  chatName: string;
  isGroup: boolean;
  uniqueSenders: number;
  premise?: string;
  title?: string;
  subtitle?: string;
}

export function ChatThreadHeader({
  chatName,
  isGroup,
  uniqueSenders,
  premise,
  title,
  subtitle,
}: ChatThreadHeaderProps) {
  const [taskOpen, setTaskOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const displayTitle = title ?? chatName;
  const displaySubtitle = subtitle ?? (isGroup ? `Group · ${uniqueSenders} people` : undefined);

  useEffect(() => {
    if (!taskOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) setTaskOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTaskOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [taskOpen]);

  return (
    <Group
      justify="space-between"
      align="center"
      gap="sm"
      px="md"
      py="xs"
      style={{
        minHeight: 44,
        borderBottom: "1px solid #e0e0e0",
        background: "#fff",
        flexShrink: 0,
      }}
    >
      <Box style={{ flex: 1, minWidth: 0 }}>
        <Text size="sm" fw={600} c="dark">
          {displayTitle}
        </Text>
        {displaySubtitle != null && displaySubtitle !== "" && (
          <Text size="xs" c="dimmed" mt={1}>
            {displaySubtitle}
          </Text>
        )}
      </Box>

      {premise && (
        <Box ref={popoverRef} style={{ position: "relative", flexShrink: 0 }}>
          <Button
            variant="subtle"
            type="button"
            onClick={() => setTaskOpen((o) => !o)}
            aria-label="Your task / instructions"
            aria-expanded={taskOpen}
            size="compact-md"
            style={{
              width: 40,
              height: 40,
              background: taskOpen ? "#f0f4ff" : "transparent",
              color: "#5b7cff",
            }}
            styles={{
              root: { overflow: "visible" },
              inner: { justifyContent: "center", alignItems: "center", overflow: "visible" },
            }}
          >
            <FontAwesomeIcon icon={faQuestionCircle} style={{ fontSize: 18 }} />
          </Button>

          {taskOpen && (
            <Paper
              shadow="md"
              radius="lg"
              p="md"
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: 6,
                width: "min(320px, calc(100vw - 24px))",
                border: "1px solid #e5e5ea",
                zIndex: 50,
              }}
            >
              <Text size="xs" fw={700} c="#5b7cff" tt="uppercase" lts="0.06em" mb="xs">
                Objective
              </Text>
              <Text size="sm" c="dark" lh={1.5} fw={500}>
                {premise}
              </Text>
            </Paper>
          )}
        </Box>
      )}
    </Group>
  );
}

interface ChatThreadProps {
  messages: ChatMessage[];
  chatName: string;
  isGroup: boolean;
  premise?: string;
  showHeader?: boolean;
  showPremiseInBody?: boolean;
  orderedSenders?: string[];
}

export function ChatThread({
  messages,
  chatName,
  isGroup,
  premise,
  showHeader = true,
  showPremiseInBody = true,
  orderedSenders,
}: ChatThreadProps) {
  const uniqueSenders = new Set(messages.map((m) => m.sender)).size;
  const senderOrder = orderedSenders ?? getOrderedSenders(messages);

  return (
    <Box
      style={{
        display: "flex",
        flexDirection: "column",
        background: "#fff",
      }}
    >
      {showHeader && (
        <ChatThreadHeader
          chatName={chatName}
          isGroup={isGroup}
          uniqueSenders={uniqueSenders}
          premise={showPremiseInBody ? undefined : premise}
        />
      )}

      {premise && showPremiseInBody && (
        <Box
          p="md"
          style={{
            background: "#f0f4ff",
            borderBottom: "1px solid #dde2f0",
            borderLeft: "3px solid #5b7cff",
            marginBottom: 12,
            borderRadius: "0 8px 8px 0",
          }}
        >
          <Text size="xs" fw={700} c="#5b7cff" tt="uppercase" lts="0.06em" mb="xs">
            Objective
          </Text>
          <Text size="md" c="dark" lh={1.5} fw={500}>
            {premise}
          </Text>
        </Box>
      )}

      <Stack gap={2} p="sm" style={{ background: "#fff" }}>
        {messages.map((msg) => (
          <Box key={msg.id}>
            {msg.show_timestamp && (
              <Text size="xs" c="dimmed" ta="center" py="xs" mb={4}>
                {msg.timestamp}
              </Text>
            )}

            {isGroup && (
              <Text
                size="xs"
                fw={500}
                c={getSenderColor(msg.sender, senderOrder)}
                ml="sm"
                mb={2}
                mt={6}
              >
                {msg.sender}
              </Text>
            )}

            <Box className="animate-bubble" style={{ display: "flex", justifyContent: "flex-start", marginBottom: 2 }}>
              <Box
                style={{
                  maxWidth: "75%",
                  padding: msg.is_redacted ? "10px 14px" : "9px 14px",
                  borderRadius: 18,
                  borderBottomLeftRadius: 4,
                  background: "#E9E9EB",
                  color: "#000",
                  fontSize: 16,
                  lineHeight: 1.4,
                }}
              >
                {msg.is_redacted ? (
                  <Box
                    className="redacted-pulse"
                    style={{
                      width: 180,
                      height: 20,
                      background: "#000",
                      borderRadius: 4,
                    }}
                  />
                ) : (
                  msg.text
                )}
              </Box>
            </Box>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
