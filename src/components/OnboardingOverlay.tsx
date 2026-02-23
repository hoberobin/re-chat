import { Box, Stack, Text, Button } from "@mantine/core";

interface OnboardingOverlayProps {
  onDismiss: () => void;
}

const STEPS = [
  {
    icon: "💬",
    text: "Read the chat conversation carefully.",
  },
  {
    icon: "🔍",
    text: "Use the context clues to figure out the answer.",
  },
  {
    icon: "👆",
    text: "Pick A, B, or C — you only get one try.",
  },
];

export function OnboardingOverlay({ onDismiss }: OnboardingOverlayProps) {
  return (
    <>
      {/* Backdrop */}
      <Box
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0, 0, 0, 0.45)",
          zIndex: 40,
        }}
        onClick={onDismiss}
      />

      {/* Sheet */}
      <Box
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#fff",
          borderRadius: "20px 20px 0 0",
          padding: "28px 24px 40px",
          zIndex: 50,
          animation: "resultSlideUp 0.35s ease-out forwards",
        }}
      >
        <Stack gap="lg">
          {/* Header */}
          <Stack gap={4} align="center">
            <Text size="xl" fw={800} c="dark" ta="center">
              How to play
            </Text>
            <Text size="sm" c="dimmed" ta="center">
              A new puzzle every day
            </Text>
          </Stack>

          {/* Steps */}
          <Stack gap="md">
            {STEPS.map((step, i) => (
              <Box
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                }}
              >
                <Box
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: "#f2f2f7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    flexShrink: 0,
                  }}
                >
                  {step.icon}
                </Box>
                <Text size="sm" c="dark" lh={1.55} style={{ paddingTop: 10 }}>
                  {step.text}
                </Text>
              </Box>
            ))}
          </Stack>

          {/* CTA */}
          <Button
            fullWidth
            size="lg"
            radius="xl"
            fw={700}
            onClick={onDismiss}
            style={{ marginTop: 4 }}
          >
            Let&apos;s go
          </Button>
          <Text
            component="button"
            type="button"
            size="xs"
            c="dimmed"
            style={{ background: "none", border: "none", cursor: "pointer", padding: 8 }}
            onClick={onDismiss}
          >
            Skip
          </Text>
        </Stack>
      </Box>
    </>
  );
}
