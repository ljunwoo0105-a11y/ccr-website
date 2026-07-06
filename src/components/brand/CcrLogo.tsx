import Image from "next/image";
import { cn } from "@/lib/utils";

const CCR_LOGO_SRC = "/images/ccr/ccr-logo-4k.png";
const CCR_MARK_SRC = "/images/ccr/ccr-mark-4k.png";

type CcrLogoVariant = "logo" | "mark";

type CcrLogoProps = {
  readonly alt?: string;
  readonly className?: string;
  readonly priority?: boolean;
  readonly sizes?: string;
  readonly variant?: CcrLogoVariant;
};

export function CcrLogo({
  alt = "",
  className,
  priority = false,
  sizes = "48px",
  variant = "logo",
}: CcrLogoProps) {
  const source = variant === "mark" ? CCR_MARK_SRC : CCR_LOGO_SRC;

  return (
    <span
      className={cn(
        "relative block aspect-square shrink-0 overflow-hidden rounded-lg bg-white",
        className
      )}
    >
      <Image
        src={source}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className="object-contain"
      />
    </span>
  );
}
