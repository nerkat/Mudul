import { useViewMode } from "../ctx/ViewModeContext";

export function ModeSwitch() {
  const { mode, setMode } = useViewMode();
  
  return (
    <button
      onClick={() => setMode(mode === "paper" ? "rich" : "paper")}
      className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
    >
      Mode: {mode}
    </button>
  );
}