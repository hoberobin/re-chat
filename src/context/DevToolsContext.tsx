import { createContext, useContext } from "react";

export interface DevToolsContextValue {
  seedPuzzleId?: string;
  forceRevealOrder: boolean;
  forceSkipWin: boolean;
  forceShowHints: boolean;
}

const defaultValue: DevToolsContextValue = {
  forceRevealOrder: false,
  forceSkipWin: false,
  forceShowHints: false,
};

export const DevToolsContext = createContext<DevToolsContextValue>(defaultValue);

export function useDevToolsContext(): DevToolsContextValue {
  return useContext(DevToolsContext);
}
