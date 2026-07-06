import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Static five-star row for review cards and rating summaries. Filled stars
 * are always gold (the accent IS the star hue); empty stars are line-grey
 * outlines. Decorative — pair with sr-only rating text at the call site.
 */
export default function Stars({
  count = 5,
  className,
  size = "sm",
}: {
  count?: number;
  className?: string;
  size?: "sm" | "lg";
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      aria-hidden="true"
    >
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            size === "lg" ? "h-6 w-6" : "h-4 w-4",
            i < count ? "fill-gold-500 text-gold-500" : "text-line"
          )}
        />
      ))}
    </span>
  );
}
