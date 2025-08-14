import { useTheme } from "../theme/theme";

export function ThemeSwitch() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="flex gap-2 items-center">
      <label className="ui-muted text-sm">Theme</label>
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as any)}
        className="rounded-md border ui-border bg-bg px-2 py-1"
        aria-label="Theme"
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </div>
  );
}