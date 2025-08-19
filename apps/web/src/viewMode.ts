// viewMode.ts
import { useEffect, useState, useCallback } from "react";

export type ViewMode = "rich" | "paper";
const KEY = "mudul:viewMode";

// Lightweight event bus for intra-tab updates
const bus = new EventTarget();
const EVT = "viewmode:changed";

export function getInitialViewMode(): ViewMode {
  // Guard for SSR
  if (typeof window === 'undefined') return "rich";
  
  const q = new URLSearchParams(window.location.search).get("mode");
  if (q === "paper") return "paper";
  
  // Guard for missing localStorage
  if (typeof localStorage === 'undefined') return "rich";
  
  const saved = localStorage.getItem(KEY);
  return (saved === "paper" || saved === "rich") ? (saved as ViewMode) : "rich";
}

export function saveViewMode(m: ViewMode) {
  // Guard for SSR
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(KEY, m);

  // Update URL param while preserving other query parameters and hash
  const url = new URL(window.location.href);
  if (m === "paper") {
    url.searchParams.set("mode", "paper");
  } else {
    url.searchParams.delete("mode");
  }
  
  // Use replaceState to avoid adding to history, preserving hash
  window.history.replaceState({}, "", url.toString());

  // Notify listeners in this tab
  bus.dispatchEvent(new CustomEvent<ViewMode>(EVT, { detail: m }));
}

/**
 * React hook that:
 * - tracks current mode
 * - reacts to URL/back/forward (popstate)
 * - reacts to cross-tab localStorage changes
 * - reacts to in-tab saveViewMode() calls
 */
export function useViewMode() {
  const [mode, setMode] = useState<ViewMode>(() => getInitialViewMode());

  const applyFromUrl = useCallback(() => {
    // Guard for SSR
    if (typeof window === 'undefined') return;
    
    const q = new URLSearchParams(window.location.search).get("mode");
    if (q === "paper") {
      setMode("paper");
    } else {
      const saved = localStorage.getItem(KEY);
      setMode((saved === "paper" || saved === "rich") ? (saved as ViewMode) : "rich");
    }
  }, []);

  useEffect(() => {
    // Guard for SSR
    if (typeof window === 'undefined') return;
    
    // 1) In-tab updates via our bus
    const onBus = (e: Event) => {
      const m = (e as CustomEvent<ViewMode>).detail;
      setMode(m);
    };
    bus.addEventListener(EVT, onBus);

    // 2) Back/forward or manual URL changes
    const onPop = () => applyFromUrl();
    window.addEventListener("popstate", onPop);

    // 3) Cross-tab/localStorage changes
    const onStorage = (ev: StorageEvent) => {
      if (ev.key === KEY) applyFromUrl();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      bus.removeEventListener(EVT, onBus);
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("storage", onStorage);
    };
  }, [applyFromUrl]);

  const setViewMode = useCallback((m: ViewMode) => {
    saveViewMode(m);           // persists + updates URL + emits bus event
    setMode(m);                // immediate local state update
  }, []);

  const toggleViewMode = useCallback(() => {
    setViewMode(mode === "paper" ? "rich" : "paper");
  }, [mode, setViewMode]);

  return { mode, setViewMode, toggleViewMode };
}
