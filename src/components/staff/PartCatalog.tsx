"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PartFormModal from "@/components/staff/PartFormModal";
import {
  type CatalogPartRow,
  CatalogResponseParseError,
  parseCatalogPartsResponse,
} from "@/components/staff/part-catalog-schema";
import { responseErrorMessage } from "@/components/staff/part-catalog-api";
import { PartCatalogTable } from "@/components/staff/PartCatalogTable";
import { PartCatalogToolbar } from "@/components/staff/PartCatalogToolbar";

type CatalogMode = "admin" | "staff";
type ModalState =
  | { readonly mode: "create" }
  | { readonly mode: "edit"; readonly part: CatalogPartRow }
  | null;
type MutationAction = "deactivate" | "reactivate" | "hard-delete";

type PartCatalogProps = {
  readonly mode: CatalogMode;
};

function mutationPrompt(action: MutationAction, part: CatalogPartRow): string {
  switch (action) {
    case "deactivate":
      return `Deactivate ${part.brand} ${part.model} - ${part.repairType}? It stays in the database and can be reactivated.`;
    case "hard-delete":
      return `Hard delete inactive part ${part.brand} ${part.model}? This cannot be undone.`;
    case "reactivate":
      return "";
  }
}

function mutationRequest(action: MutationAction, part: CatalogPartRow): RequestInit & { readonly url: string } {
  switch (action) {
    case "deactivate":
      return { url: `/api/staff/parts/${part.id}`, method: "DELETE" };
    case "hard-delete":
      return { url: `/api/staff/parts/${part.id}?hard=1`, method: "DELETE" };
    case "reactivate":
      return {
        url: `/api/staff/parts/${part.id}`,
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: true }),
      };
  }
}

export default function PartCatalog({ mode }: PartCatalogProps) {
  const [parts, setParts] = useState<CatalogPartRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [deviceType, setDeviceType] = useState("");
  const [brand, setBrand] = useState("");
  const [quality, setQuality] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [brands, setBrands] = useState<string[]>([]);
  const [modal, setModal] = useState<ModalState>(null);
  const [busyRow, setBusyRow] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setLoadError(null);
    try {
      const qs = new URLSearchParams();
      if (search) qs.set("search", search);
      if (deviceType) qs.set("deviceType", deviceType);
      if (brand) qs.set("brand", brand);
      if (quality) qs.set("quality", quality);
      qs.set("active", mode === "admin" && showInactive ? "all" : "true");
      const res = await fetch(`/api/staff/parts?${qs.toString()}`);
      const json = parseCatalogPartsResponse(await res.json());
      if (requestId !== requestIdRef.current) return;
      if (!res.ok || !json.ok) {
        const fallback = "Could not load the price list";
        setLoadError(json.ok ? fallback : json.error ?? fallback);
        setParts([]);
      } else {
        setParts(json.data);
        setBrands((prev) =>
          Array.from(new Set([...prev, ...json.data.map((part) => part.brand)])).sort()
        );
      }
    } catch (error) {
      if (error instanceof CatalogResponseParseError && requestId === requestIdRef.current) {
        setLoadError("Could not load the price list");
        setParts([]);
        return;
      }
      if (error instanceof Error && requestId === requestIdRef.current) {
        setLoadError("Network error - try again");
        return;
      }
      throw error;
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [brand, deviceType, mode, quality, search, showInactive]);

  useEffect(() => {
    void load();
  }, [load]);

  async function mutatePart(action: MutationAction, part: CatalogPartRow) {
    if (mode !== "admin") return;
    const prompt = mutationPrompt(action, part);
    if (prompt && !window.confirm(prompt)) return;
    const request = mutationRequest(action, part);
    setBusyRow(part.id);
    setMutationError(null);
    try {
      const res = await fetch(request.url, request);
      const message = await responseErrorMessage(res, "Could not update the part");
      if (message) {
        setMutationError(message);
        return;
      }
      await load();
    } catch (error) {
      if (error instanceof Error) {
        setMutationError("Network error - try again");
        return;
      }
      throw error;
    } finally {
      setBusyRow(null);
    }
  }

  function handleSaved() {
    setModal(null);
    void load();
  }

  return (
    <div className="space-y-4">
      <PartCatalogToolbar
        mode={mode}
        searchInput={searchInput}
        deviceType={deviceType}
        brand={brand}
        quality={quality}
        brands={brands}
        showInactive={showInactive}
        onSearchInput={setSearchInput}
        onDeviceType={setDeviceType}
        onBrand={setBrand}
        onQuality={setQuality}
        onShowInactive={setShowInactive}
        onCreate={() => setModal({ mode: "create" })}
      />

      {(loadError || mutationError) && (
        <p role="alert" className="border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {mutationError ?? loadError}
        </p>
      )}

      <PartCatalogTable
        mode={mode}
        parts={parts}
        loading={loading}
        busyRow={busyRow}
        onEdit={(part) => setModal({ mode: "edit", part })}
        onDeactivate={(part) => void mutatePart("deactivate", part)}
        onReactivate={(part) => void mutatePart("reactivate", part)}
        onHardDelete={(part) => void mutatePart("hard-delete", part)}
      />

      {modal && mode === "admin" && (
        <PartFormModal
          part={modal.mode === "edit" ? modal.part : null}
          onSaved={handleSaved}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
