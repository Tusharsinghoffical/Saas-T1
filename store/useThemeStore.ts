import { create } from "zustand";

type ThemeMode = "light" | "dark" | "system";

interface ThemeState {
  theme: ThemeMode;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  initTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "system",
  resolvedTheme: "light",

  initTheme: () => {
    if (typeof window === "undefined") return;

    const savedTheme = (localStorage.getItem("tasq_theme") as ThemeMode) || "system";
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const resolved =
      savedTheme === "system" ? (systemPrefersDark ? "dark" : "light") : savedTheme;

    if (resolved === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    set({ theme: savedTheme, resolvedTheme: resolved });

    // Listen to OS theme changes if on system mode
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (e) => {
        if (get().theme === "system") {
          const newResolved = e.matches ? "dark" : "light";
          if (newResolved === "dark") {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
          set({ resolvedTheme: newResolved });
        }
      });
  },

  setTheme: (theme: ThemeMode) => {
    if (typeof window === "undefined") return;

    localStorage.setItem("tasq_theme", theme);
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const resolved =
      theme === "system" ? (systemPrefersDark ? "dark" : "light") : theme;

    if (resolved === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    set({ theme, resolvedTheme: resolved });
  },

  toggleTheme: () => {
    const current = get().resolvedTheme;
    const next = current === "dark" ? "light" : "dark";
    get().setTheme(next);
  },
}));
