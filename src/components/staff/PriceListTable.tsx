"use client";

import PartCatalog from "@/components/staff/PartCatalog";

type PriceListTableProps = {
  readonly mode: "admin" | "staff";
};

export default function PriceListTable({ mode }: PriceListTableProps) {
  return <PartCatalog mode={mode} />;
}
