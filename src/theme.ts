import { createTheme } from "@mantine/core";

/**
 * Design tokens for visual parity with the existing UI.
 * Primary: #007AFF, Error: #FF3B30, iOS-like grays.
 */
export const theme = createTheme({
  primaryColor: "primary",
  primaryShade: 6,
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif',
  defaultRadius: "md",
  radius: {
    xs: "6px",
    sm: "8px",
    md: "10px",
    lg: "12px",
    xl: "14px",
  },
  colors: {
    primary: [
      "#e8f2ff",
      "#b3d7ff",
      "#80bfff",
      "#4da6ff",
      "#3393ff",
      "#1a85ff",
      "#007AFF",
      "#0066dd",
      "#0052b3",
      "#003d88",
    ],
    // Override red for error states (Alert, danger buttons, etc.)
    red: [
      "#ffebee",
      "#ffcdd2",
      "#ef9a9a",
      "#e57373",
      "#ef5350",
      "#f44336",
      "#FF3B30",
      "#e53935",
      "#d32f2f",
      "#c62828",
    ],
  },
  other: {
    textDark: "#1c1c1e",
    textMuted: "#6b6b70",
    border: "#d1d1d6",
    borderLight: "#e5e5ea",
  },
});
