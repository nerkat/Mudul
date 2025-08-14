import { createContext, useContext, useMemo, useState } from "react";
import { getInitialViewMode, saveViewMode, type ViewMode } from "../viewMode";

interface ViewModeContextType {
  mode: ViewMode;
  setMode: (mode: ViewMode) => void;
}

const Ctx = createContext<ViewModeContextType | null>(null);

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ViewMode>(getInitialViewMode);

  const setMode = useMemo(() => (newMode: ViewMode) => {
    setModeState(newMode);
    saveViewMode(newMode);
  }, []);

  const value = useMemo(() => ({ mode, setMode }), [mode, setMode]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useViewMode(): ViewModeContextType {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useViewMode must be used within ViewModeProvider");
  return ctx;
}