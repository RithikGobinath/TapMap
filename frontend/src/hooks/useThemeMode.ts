import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

export type ThemeMode = "dark" | "light";
export const THEME_STORAGE_KEY = "tapmap-theme-mode";

function getInitialThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function useThemeMode(): [ThemeMode, Dispatch<SetStateAction<ThemeMode>>] {
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialThemeMode);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", themeMode);
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
  }, [themeMode]);

  return [themeMode, setThemeMode];
}
