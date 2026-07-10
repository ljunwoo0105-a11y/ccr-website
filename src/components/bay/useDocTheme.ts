"use client";

import { useEffect, useState } from "react";

/**
 * Mirrors the document's data-theme attribute (set by the boot script in
 * the root layout and flipped by ThemeToggle) into React state so the
 * WebGL scenes can re-ink themselves — CSS variables can't reach into a
 * canvas.
 */
export default function useDocTheme(): "light" | "dark" {
  // Seed from the DOM (the boot script has already stamped data-theme by
  // the time any client component runs) so the first WebGL frame is not
  // light-inked for dark-mode visitors.
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    typeof document !== "undefined" &&
    document.documentElement.dataset.theme === "dark"
      ? "dark"
      : "light",
  );

  useEffect(() => {
    const el = document.documentElement;
    const read = () =>
      setTheme(el.dataset.theme === "dark" ? "dark" : "light");
    read();
    const observer = new MutationObserver(read);
    observer.observe(el, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return theme;
}
