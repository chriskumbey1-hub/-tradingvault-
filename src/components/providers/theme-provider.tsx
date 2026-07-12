"use client";

import * as React from "react";

type Theme = "dark" | "light" | "system";

const ThemeContext = React.createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "dark" | "light";
}>({
  theme: "dark",
  setTheme: () => {},
  resolvedTheme: "dark",
});

export function useTheme() {
  return React.useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>("dark");
  const [resolvedTheme, setResolvedTheme] = React.useState<"dark" | "light">("dark");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("tradevault-theme") as Theme | null;
    if (saved) setThemeState(saved);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.classList.remove("light", "dark");

    let resolved: "dark" | "light";
    if (theme === "system") {
      resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } else {
      resolved = theme;
    }

    root.classList.add(resolved);
    setResolvedTheme(resolved);
  }, [theme, mounted]);

  const setTheme = React.useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem("tradevault-theme", t);
  }, []);

  if (!mounted) {
    return <div className="dark">{children}</div>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
