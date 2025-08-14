import { ThemeSwitch } from "./ThemeSwitch";
import { ModeSwitch } from "./ModeSwitch";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-20 bg-bg/80 backdrop-blur ui-border border-b">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="font-semibold">Mudul</div>
          <div className="flex gap-4 items-center">
            <ModeSwitch />
            <ThemeSwitch />
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}