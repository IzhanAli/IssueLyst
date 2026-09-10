"use client";

import { useCallback, useEffect, useState } from "react";
import { THEME_KEY } from "@/lib/constants";

type Theme = "light" | "dark";

function current(): Theme {
  if (typeof document === "undefined") return "light";
  return (document.documentElement.getAttribute("data-theme") as Theme) || "light";
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => setThemeState(current()), []);

  const setTheme = useCallback((next: Theme) => {
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {}
    setThemeState(next);
  }, []);

  const toggle = useCallback(() => setTheme(current() === "dark" ? "light" : "dark"), [setTheme]);

  return { theme, setTheme, toggle };
}
