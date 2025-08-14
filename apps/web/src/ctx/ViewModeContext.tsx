import { createContext, useContext, useMemo, useState, useEffect } from "react";
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

  // Add keyboard shortcut for 'p' key to toggle paper mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not in an input field and 'p' key is pressed
      if (e.key === 'p' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
          e.preventDefault();
          setMode(mode === "paper" ? "rich" : "paper");
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mode, setMode]);

  const value = useMemo(() => ({ mode, setMode }), [mode, setMode]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useViewMode(): ViewModeContextType {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useViewMode must be used within ViewModeProvider");
  return ctx;
}