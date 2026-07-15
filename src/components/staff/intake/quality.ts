import { PART_QUALITIES, QUALITY_LABELS } from "@/lib/config";

type PartQuality = (typeof PART_QUALITIES)[number];

function isPartQuality(value: string): value is PartQuality {
  return PART_QUALITIES.some((quality) => quality === value);
}

export function intakePartQualityLabel(value: string | null): string {
  if (value === null) return "Not decided";
  return isPartQuality(value) ? QUALITY_LABELS[value] : value;
}
