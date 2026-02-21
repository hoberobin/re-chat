import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLightbulb } from "@fortawesome/free-solid-svg-icons";
import { Box, Button, Paper, Text, Stack } from "@mantine/core";

interface HintIconProps {
  hints: string[];
  onRevealMore?: () => void;
  isHighlighted?: boolean;
  onOpen?: () => void;
}

export function HintIcon({ hints, onRevealMore, isHighlighted, onOpen }: HintIconProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) onOpen?.();
  };

  return (
    <Box ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <Button
        variant="subtle"
        type="button"
        onClick={handleToggle}
        aria-label="View hints"
        aria-expanded={open}
        p="xs"
        className={isHighlighted ? "hint-glow" : ""}
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          color: "var(--mantine-color-yellow-6)",
          background: "transparent",
          touchAction: "manipulation",
        }}
        styles={{ inner: { justifyContent: "center", alignItems: "center" } }}
      >
        <FontAwesomeIcon icon={faLightbulb} style={{ width: 20, height: 20 }} />
      </Button>
      {open && (
        <Paper
          shadow="lg"
          radius="lg"
          p="md"
          className="animate-fade-in"
          role="dialog"
          aria-label="Hints"
          style={{
            position: "absolute",
            right: 0,
            top: "100%",
            marginTop: 8,
            zIndex: 50,
            minWidth: 200,
            maxWidth: 280,
            border: "1px solid #e5e7eb",
          }}
        >
          <Text size="xs" fw={600} c="dimmed" tt="uppercase" lts="0.05em" mb="xs">
            Hints
          </Text>
          {hints.length > 0 ? (
            <Stack gap={4}>
              {hints.map((c, i) => (
                <Text key={i} size="sm" c="dimmed">
                  {c}
                </Text>
              ))}
            </Stack>
          ) : (
            <Text size="sm" c="dimmed" mb="xs">
              Need a hint? Struggling will reveal hints.
            </Text>
          )}
          {onRevealMore && (
            <Button
              variant="subtle"
              size="sm"
              color="gray"
              onClick={onRevealMore}
              mt="xs"
              style={{ alignSelf: "flex-start", textDecoration: "underline" }}
            >
              Another hint
            </Button>
          )}
        </Paper>
      )}
    </Box>
  );
}
