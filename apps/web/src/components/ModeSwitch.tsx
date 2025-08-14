import { useViewMode } from "../ctx/ViewModeContext";

export function ModeSwitch() {
  const { mode, setMode } = useViewMode();
  
  return (
    <button
      onClick={() => setMode(mode === "paper" ? "rich" : "paper")}
      className="px-3 py-1 text-sm border border-border bg-surface text-fg rounded hover:bg-border transition-colors"
    >
      Mode: {mode}
    </button>
  );
}