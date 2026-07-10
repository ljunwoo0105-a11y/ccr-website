"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, SunMoon } from "lucide-react";

const STORAGE_KEY = "ccr-theme";

function applyTheme(theme: "light" | "dark") {
  const el = document.documentElement;
  el.dataset.theme = theme;
  el.style.colorScheme = theme;
}

/**
 * Light/dark switch for the manual — day bench or night bench. The boot
 * script in the root layout resolves the initial theme before first paint
 * (stored choice, else system preference); this chip just flips and
 * persists it. Renders a neutral icon until mounted so server and client
 * markup agree.
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    const readDom = () =>
      setTheme(
        document.documentElement.dataset.theme === "dark" ? "dark" : "light",
      );
    readDom();

    // No explicit choice stored → keep following the OS while the tab lives.
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = (e: MediaQueryListEvent) => {
      try {
        if (localStorage.getItem(STORAGE_KEY)) return;
      } catch {
        /* storage unavailable — still follow the OS */
      }
      const next = e.matches ? "dark" : "light";
      applyTheme(next);
      setTheme(next);
    };
    // Safari < 14 has MediaQueryList without EventTarget — use addListener.
    const legacyMedia = media as MediaQueryList & {
      addListener?: (cb: (e: MediaQueryListEvent) => void) => void;
      removeListener?: (cb: (e: MediaQueryListEvent) => void) => void;
    };
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", onSystemChange);
    } else {
      legacyMedia.addListener?.(onSystemChange);
    }

    // A toggle in another tab, or a bfcache restore after one, must re-sync.
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      if (e.newValue === "dark" || e.newValue === "light") {
        applyTheme(e.newValue);
        setTheme(e.newValue);
      }
    };
    const onPageShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === "dark" || stored === "light") {
          applyTheme(stored);
        } else {
          // No explicit choice — re-resolve the OS preference, which may have
          // flipped while the page sat frozen in the bfcache.
          applyTheme(media.matches ? "dark" : "light");
        }
      } catch {
        // storage unavailable — follow the OS preference.
        applyTheme(media.matches ? "dark" : "light");
      }
      readDom();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      if (typeof media.removeEventListener === "function") {
        media.removeEventListener("change", onSystemChange);
      } else {
        legacyMedia.removeListener?.(onSystemChange);
      }
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
