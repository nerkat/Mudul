import { createContext, useContext, useMemo, useState, useEffect, useCallback } from "react";
import { getInitialViewMode, saveViewMode, type ViewMode } from "../viewMode";

interface ViewModeContextType {
  mode: ViewMode;
  setMode: (mode: ViewMode) => void;
  toggleMode: () => void;
}

const Ctx = createContext<ViewModeContextType | null>(null);

// Keep in sync with the key used inside viewMode.ts
const STORAGE_KEY = "mudul:viewMode";

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  // Initialize from URL (?mode=paper) > localStorage > default
  const [mode, setModeState] = useState<ViewMode>(() => getInitialViewMode());

  // Persist + URL-sync + state update
  const setMode = useCallback((newMode: ViewMode) => {
    setModeState(newMode);
    saveViewMode(newMode);
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === "paper" ? "rich" : "paper");
  }, [mode, setMode]);

  // React to browser back/forward or manual URL changes
  useEffect(() => {
    // Guard for SSR
    if (typeof window === 'undefined') return;
    
    const applyFromUrl = () => {
      const next = getInitialViewMode(); // prioritizes URL param
      setModeState(next);
    };
    
    window.addEventListener("popstate", applyFromUrl);
    return () => window.removeEventListener("popstate", applyFromUrl);
  }, []);

  // React to cross-tab/localStorage changes
  useEffect(() => {
    // Guard for SSR
    if (typeof window === 'undefined') return;
    
    // Throttle storage events to prevent flicker when multiple tabs update rapidly
    let throttleTimer: NodeJS.Timeout | null = null;
    
    const onStorage = (ev: StorageEvent) => {
      if (ev.key === STORAGE_KEY || ev.key === null) {
        // Clear any pending throttled update
        if (throttleTimer) clearTimeout(throttleTimer);
        
        // Throttle updates to prevent rapid flickering
        throttleTimer = setTimeout(() => {
          // Re-read from URL/localStorage to resolve precedence correctly
          const next = getInitialViewMode();
          setModeState(next);
          throttleTimer = null;
        }, 50); // 50ms throttle
      }
    };
    
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, []);

  // Keyboard shortcut: 'p' toggles (unless in an input/textarea, with modifiers, or contentEditable)
  useEffect(() => {
    // Guard for SSR
    if (typeof window === 'undefined') return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only respond to 'p' key without any modifier keys
      if ((e.key === "p" || e.key === "P") && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        const target = e.target as HTMLElement | null;
        const tag = (target?.tagName ?? "").toUpperCase();
        const isEditable = !!target && (
          target.isContentEditable || 
          tag === "INPUT" || 
          tag === "TEXTAREA" ||
          target.hasAttribute('contenteditable')
        );
        
        if (!isEditable) {
          e.preventDefault();
          toggleMode();
        }
      }
    };
    
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [toggleMode]);

  const value = useMemo(() => ({ mode, setMode, toggleMode }), [mode, setMode, toggleMode]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useViewMode(): ViewModeContextType {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useViewMode must be used within ViewModeProvider");
  return ctx;
}
