import { useTheme } from "../theme/hooks";
import type { Theme } from "../theme/types";

export function ThemeSwitch() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="flex gap-2 items-center">
      <label className="text-muted text-sm">Theme</label>
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as Theme)}
        className="rounded border border-border text-fg px-2 py-1 hover:bg-border transition-colors"
        aria-label="Theme"
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </div>
  );
}