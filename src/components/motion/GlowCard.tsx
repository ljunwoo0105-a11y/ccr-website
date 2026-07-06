"use client";

import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Bench-lamp glow host: drives --glow-x/--glow-y custom props from the
 * pointer so the `.bench-glow` CSS radial follows the cursor — like moving a
 * bench lamp over the part you're inspecting. Pointer-fine devices only;
 * cheap (rAF-throttled, CSS does the painting).
 */
export default function GlowCard({
  children,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "article" | "li";
}) {
  const ref = useRef<HTMLElement | null>(null);
  const frame = useRef<number>();
  const enabled = useRef(false);

  useEffect(() => {
    enabled.current =
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, []);

  const onPointerMove = useCallback((event: React.PointerEvent) => {
    if (!enabled.current || !ref.current) return;
    const node = ref.current;
    const rect = node.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      node.style.setProperty("--glow-x", `${x}px`);
      node.style.setProperty("--glow-y", `${y}px`);
    });
  }, []);

  return (
    <Tag
      // @ts-expect-error — polymorphic ref is safe for the listed tags
      ref={ref}
      className={cn("bench-glow", className)}
      onPointerMove={onPointerMove}
    >
      {children}
    </Tag>
  );
}
