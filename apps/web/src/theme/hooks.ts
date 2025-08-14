import { createContext, useContext } from "react";
import type { Theme } from "./types";

export const ThemeCtx = createContext<{ theme: Theme; setTheme: (t: Theme) => void }>({ theme: "system", setTheme: () => {} });

export const useTheme = () => useContext(ThemeCtx);