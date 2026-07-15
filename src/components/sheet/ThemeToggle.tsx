"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, SunMoon } from "lucide-react";

const STORAGE_KEY = "ccr-theme";
const DEFAULT_THEME = "dark";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  const el = document.documentElement;
  el.dataset.theme = theme;
  el.style.colorScheme = theme;
}

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "dark" || stored === "light" ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

/**
 * Light/dark switch for the manual — day bench or night bench. The boot
 * script in the root layout resolves the initial theme before first paint
 * (stored choice, else dark); this chip just flips and persists it. Renders
 * a neutral icon until mounted so server and client markup agree.
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const readDom = () =>
      setTheme(
        document.documentElement.dataset.theme === "dark" ? "dark" : "light",
      );
    readDom();

    // A toggle in another tab, or a bfcache restore after one, must re-sync.
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      if (e.newValue === "dark" || e.newValue === "light") {
        applyTheme(e.newValue);
        setTheme(e.newValue);
      } else {
        applyTheme(DEFAULT_THEME);
        setTheme(DEFAULT_THEME);
      }
    };
    const onPageShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      applyTheme(readStoredTheme());
      readDom();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private mode — theme still applies for this page view */
    }
  };

  return (
    <button
      type="button"
      className="mnl-chip"
      onClick={toggle}
      disabled={theme === null}
      aria-label={
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
      }
      title={theme === "dark" ? "Day bench" : "Night bench"}
    >
      {theme === null ? (
        <SunMoon className="h-4 w-4" aria-hidden="true" />
      ) : theme === "dark" ? (
        <Sun className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4" aria-hidden="true" />
      )}
      <span className="hidden md:inline">
        {theme === "dark" ? "Day" : "Night"}
      </span>
    </button>
  );
}
