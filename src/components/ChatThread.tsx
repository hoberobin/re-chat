import type { ChatMessage } from "../types/puzzle";
import { getSenderColor, getOrderedSenders } from "../utils/chatColors";
import { Box, Group, Stack, Text } from "@mantine/core";

interface ChatThreadHeaderProps {
  chatName: string;
  subtitle?: string;
}

export function ChatThreadHeader({
  chatName,
  subtitle,
}: ChatThreadHeaderProps) {
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
          {chatName}
        </Text>
        {subtitle != null && subtitle !== "" && (
          <Text size="xs" c="dimmed" mt={1}>
            {subtitle}
          </Text>
        )}
      </Box>
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
        <ChatThreadHeader chatName={chatName} />
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
        {messages.map((msg) => {
          // Size the redacted bar proportionally to the hidden text length
          const barWidth = msg.is_redacted
            ? Math.max(60, Math.min(210, Math.round(msg.text.length * 5)))
            : 0;

          return (
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
                        width: barWidth,
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
          );
        })}
      </Stack>
    </Box>
  );
}
