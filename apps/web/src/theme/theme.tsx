import React, { useEffect, useMemo, useState } from "react";
import type { Theme } from "./types";
import { ThemeCtx } from "./hooks";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("theme") as Theme) || "system");

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = (t: Theme) => {
      const effective = t === "system" ? (mq.matches ? "dark" : "light") : t;
      // Use Tailwind's class-based dark mode
      if (effective === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      localStorage.setItem("theme", t);
    };
    apply(theme);
    if (theme === "system") {
      const listener = () => apply("system");
      mq.addEventListener?.("change", listener);
      return () => mq.removeEventListener?.("change", listener);
    }
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme }), [theme]);
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}