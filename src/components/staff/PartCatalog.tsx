"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PartFormModal from "@/components/staff/PartFormModal";
import {
  type CatalogPartRow,
  CatalogResponseParseError,
  parseBulkPartsResponse,
  parseCatalogPartsResponse,
} from "@/components/staff/part-catalog-schema";
import { responseErrorMessage } from "@/components/staff/part-catalog-api";
import { PartCatalogTable } from "@/components/staff/PartCatalogTable";
import { PartCatalogToolbar } from "@/components/staff/PartCatalogToolbar";
import { apiJson } from "@/lib/api-client";

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
        ...apiJson("PATCH", { active: true }),
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
  const [selectedIds, setSelectedIds] = useState<readonly string[]>([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkNotice, setBulkNotice] = useState<string | null>(null);
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
        // Drop anything no longer in view, so a filter change can't leave a
        // hidden row selected and silently included in the next bulk action.
        const visible = new Set(json.data.map((part) => part.id));
        setSelectedIds((prev) => prev.filter((id) => visible.has(id)));
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

  function toggleSelected(id: string) {
    setBulkNotice(null);
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
    );
  }

  function toggleSelectAll() {
    setBulkNotice(null);
    setSelectedIds((prev) =>
      prev.length === parts.length ? [] : parts.map((part) => part.id)
    );
  }

  async function runBulk(action: MutationAction) {
    if (mode !== "admin" || selectedIds.length === 0) return;
    const count = selectedIds.length;
    const noun = `${count} part${count === 1 ? "" : "s"}`;
    const prompt =
      action === "hard-delete"
        ? `Permanently delete ${noun}? Only inactive parts with no repair history can be deleted, and this cannot be undone.`
        : action === "deactivate"
          ? `Deactivate ${noun}? They stay in the database and can be reactivated.`
          : "";
    if (prompt && !window.confirm(prompt)) return;

    setBulkBusy(true);
    setMutationError(null);
    setBulkNotice(null);
    try {
      const res = await fetch(
        "/api/staff/parts/bulk",
        apiJson("POST", { ids: selectedIds, action })
      );
      // Read the body exactly once — Response.json() cannot be called twice,
      // and a second read throws in a way that reads as a network failure.
      const json = parseBulkPartsResponse(await res.json());
      if (!res.ok || !json.ok) {
        const fallback = "Could not update the selected parts";
        setMutationError(json.ok ? fallback : json.error ?? fallback);
        return;
      }
      const done = json.data.succeeded.length;
      const failed = json.data.failed;
      // Partial success is the normal case for a hard delete, so say exactly
      // what happened rather than implying everything worked.
      setBulkNotice(
        failed.length === 0
          ? `${done} part${done === 1 ? "" : "s"} updated.`
          : `${done} updated, ${failed.length} skipped — ${failed[0]?.reason ?? "not permitted"}`
      );
      setSelectedIds([]);
      await load();
    } catch (error) {
      if (error instanceof CatalogResponseParseError) {
        setMutationError("Could not update the selected parts");
        return;
      }
      if (error instanceof Error) {
        setMutationError("Network error - try again");
        return;
      }
      throw error;
    } finally {
      setBulkBusy(false);
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

      {bulkNotice && (
        <p role="status" className="border border-carbon-150 bg-bone-100 px-3 py-2 text-sm text-carbon-700">
          {bulkNotice}
        </p>
      )}

      {mode === "admin" && selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border border-carbon-950 bg-bone-200 px-3 py-2">
          <p className="text-sm font-medium text-carbon-950">
            {selectedIds.length} selected
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-50"
              disabled={bulkBusy}
              onClick={() => void runBulk("deactivate")}
            >
              Deactivate
            </button>
            <button
              type="button"
              className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-50"
              disabled={bulkBusy}
              onClick={() => void runBulk("reactivate")}
            >
              Reactivate
            </button>
            <button
              type="button"
              className="border border-rose-500 px-3 py-1.5 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
              disabled={bulkBusy}
              onClick={() => void runBulk("hard-delete")}
            >
              {bulkBusy ? "Working…" : "Delete permanently"}
            </button>
            <button
              type="button"
              className="px-2 py-1.5 text-sm text-carbon-500 underline-offset-2 hover:underline"
              disabled={bulkBusy}
              onClick={() => setSelectedIds([])}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      <PartCatalogTable
        mode={mode}
        parts={parts}
        loading={loading}
        busyRow={busyRow}
        selectedIds={selectedIds}
        onToggleSelected={toggleSelected}
        onToggleSelectAll={toggleSelectAll}
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
