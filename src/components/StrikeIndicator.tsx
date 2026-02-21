import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { Group, Box } from "@mantine/core";

interface StrikeIndicatorProps {
  strikes: number;
}

export function StrikeIndicator({ strikes }: StrikeIndicatorProps) {
  return (
    <Group gap="xs" align="center" aria-label={`${strikes} of 3 strikes`}>
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          component="span"
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            border: "2px solid",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.3s",
            ...(i < strikes
              ? {
                  borderColor: "var(--mantine-color-red-6)",
                  backgroundColor: "var(--mantine-color-red-6)",
                  color: "white",
                  transform: "scale(1.1)",
                }
              : {
                  borderColor: "#d1d5db",
                  backgroundColor: "transparent",
                  color: "#9ca3af",
                }),
          }}
        >
          {i < strikes ? (
            <FontAwesomeIcon icon={faXmark} style={{ width: 16, height: 16 }} />
          ) : null}
        </Box>
      ))}
    </Group>
  );
}
