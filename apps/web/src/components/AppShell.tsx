import { ThemeSwitch } from "./ThemeSwitch";
import { ModeSwitch } from "./ModeSwitch";
import { Sidebar } from "../nav/Sidebar";
import { useParams } from "react-router-dom";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { org = "acme" } = useParams() as any;

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-20 bg-bg/80 backdrop-blur border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="font-semibold">Mudul</div>
          <div className="flex gap-4 items-center">
            <ModeSwitch />
            <ThemeSwitch />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6 flex gap-6">
          <Sidebar org={org} />
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </main>
    </div>
  );
}