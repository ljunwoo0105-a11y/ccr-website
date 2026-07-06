import { cn } from "@/lib/utils";

/**
 * Inline-SVG rendering of the CCR mark (phone outline + C + camera dot),
 * drawn in currentColor so it recolors cleanly on any surface — no PNG
 * filter hacks. `variant="blueprint"` renders thin uniform strokes for the
 * hero schematic treatment. The 4K PNGs (CcrLogo) remain the print-fidelity
 * assets; this is the UI mark.
 */
export function CcrMark({
  className,
  variant = "solid",
  title,
}: {
  className?: string;
  variant?: "solid" | "blueprint";
  title?: string;
}) {
  const bp = variant === "blueprint";
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      className={cn("block", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      {/* Phone body */}
      <rect
        x="158"
        y="34"
        width="196"
        height="444"
        rx="46"
        strokeWidth={bp ? 6 : 26}
      />
      {/* Outer C ring — breaks past the phone's left edge */}
      <path
        d="M 351 128 A 148 148 0 1 0 351 340"
        strokeWidth={bp ? 6 : 20}
      />
      {/* Inner bold C */}
      <path
        d="M 330 172 A 92 92 0 1 0 330 296"
        strokeWidth={bp ? 10 : 58}
      />
      {/* Camera / home dot */}
      <circle cx="256" cy="414" r="28" strokeWidth={bp ? 6 : 18} />
      <circle
        cx="256"
        cy="414"
        r={bp ? 4 : 6}
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}
