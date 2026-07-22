"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiJson } from "@/lib/api-client";
import { NAV_META, type AdminNavLayout } from "./admin-nav";

/**
 * Modal editor for the console menu: rename categories, add/delete them, and
 * arrange sections via drag-and-drop (native HTML5 — no dependency) or the
 * arrow buttons, which keep the whole thing keyboard-usable. Sections can
 * never be removed, only moved: deleting a category hands its sections to the
 * neighbouring one.
 */

interface EditableGroup {
  id: string;
  title: string;
  items: string[];
}

/** Insertion point while dragging: before `index` within `groupIndex`. */
interface DropTarget {
  groupIndex: number;
  index: number;
}

function newGroupId(): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `cat-${rand}`;
}

export function AdminNavEditor({
  layout,
  onClose,
}: {
  layout: AdminNavLayout;
  onClose: () => void;
}) {
  const router = useRouter();
  const [groups, setGroups] = useState<EditableGroup[]>(() =>
    layout.groups.map((g) => ({ id: g.id, title: g.title, items: [...g.items] }))
  );
  const [dragging, setDragging] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function renameGroup(index: number, title: string) {
    setGroups((prev) => prev.map((g, i) => (i === index ? { ...g, title } : g)));
  }

  function addGroup() {
    setGroups((prev) => [
      ...prev,
      { id: newGroupId(), title: "New category", items: [] },
    ]);
  }

  function moveGroup(index: number, delta: -1 | 1) {
    setGroups((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function deleteGroup(index: number) {
    const group = groups[index];
    if (groups.length <= 1) return;
    if (
      group.items.length > 0 &&
      !window.confirm(
        `Delete “${group.title}”? Its ${group.items.length} section(s) move to the neighbouring category.`
      )
    ) {
      return;
    }
    setGroups((prev) => {
      const next = prev.map((g) => ({ ...g, items: [...g.items] }));
      const receiver = index > 0 ? index - 1 : 1;
      next[receiver].items.push(...next[index].items);
      next.splice(index, 1);
      return next;
    });
  }

  /** Move `href` so it sits before `target.index` in `target.groupIndex`. */
  function moveItem(href: string, target: DropTarget) {
    setGroups((prev) => {
      const next = prev.map((g) => ({ ...g, items: [...g.items] }));
      const from = next.findIndex((g) => g.items.includes(href));
      if (from === -1) return prev;
      const fromIndex = next[from].items.indexOf(href);
      let insertAt = target.index;
      // Removing first shifts later indices within the same group.
      if (from === target.groupIndex && fromIndex < insertAt) insertAt -= 1;
      next[from].items.splice(fromIndex, 1);
      next[target.groupIndex].items.splice(insertAt, 0, href);
      return next;
    });
  }

  function nudgeItem(groupIndex: number, itemIndex: number, delta: -1 | 1) {
    const group = groups[groupIndex];
    const href = group.items[itemIndex];
    const target = itemIndex + delta;
    if (target >= 0 && target <= group.items.length - 1) {
      moveItem(href, { groupIndex, index: delta > 0 ? target + 1 : target });
      return;
    }
    // Crossing a category boundary.
    const nextGroup = groupIndex + delta;
    if (nextGroup < 0 || nextGroup >= groups.length) return;
    moveItem(href, {
      groupIndex: nextGroup,
      index: delta > 0 ? 0 : groups[nextGroup].items.length,
    });
  }

  async function save() {
    setSaving(true);
    setError(null);
    const payload = {
      groups: groups.map((g) => ({
        id: g.id,
        title: g.title.trim() || "Untitled",
        items: g.items,
      })),
    };
    try {
      const res = await fetch("/api/admin/nav-layout", apiJson("PUT", payload));
      const body = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !body.ok) {
        setError(body.error ?? "Could not save the menu layout.");
        return;
      }
      router.refresh();
      onClose();
    } catch {
      setError("Could not save the menu layout.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-carbon-950/60 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Customise console menu"
        className="flex max-h-[85vh] w-full max-w-lg flex-col border border-carbon-950 bg-bone-50 text-carbon-950 shadow-hard-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-carbon-150 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold">Customise menu</h2>
            <p className="text-xs text-carbon-500">
              Drag sections between categories, or use the arrows. Sections can
              be moved but never removed.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1 text-carbon-500 hover:text-carbon-950"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {groups.map((group, groupIndex) => (
            <section
              key={group.id}
              className="border border-carbon-150 bg-bone-100"
              onDragOver={(event) => {
                event.preventDefault();
                setDropTarget({ groupIndex, index: group.items.length });
              }}
              onDrop={(event) => {
                event.preventDefault();
                if (dragging && dropTarget) moveItem(dragging, dropTarget);
                setDragging(null);
                setDropTarget(null);
              }}
            >
              <div className="flex items-center gap-2 border-b border-carbon-150 px-3 py-2">
                <input
                  value={group.title}
                  onChange={(event) => renameGroup(groupIndex, event.target.value)}
                  maxLength={40}
                  aria-label={`Category ${groupIndex + 1} name`}
                  className="min-w-0 flex-1 border border-transparent bg-transparent px-1 py-0.5 text-sm font-semibold focus:border-carbon-950 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => moveGroup(groupIndex, -1)}
                  disabled={groupIndex === 0}
                  aria-label={`Move ${group.title} up`}
                  className="p-1 text-carbon-500 hover:text-carbon-950 disabled:opacity-30"
                >
                  <ChevronUp className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => moveGroup(groupIndex, 1)}
                  disabled={groupIndex === groups.length - 1}
                  aria-label={`Move ${group.title} down`}
                  className="p-1 text-carbon-500 hover:text-carbon-950 disabled:opacity-30"
                >
                  <ChevronDown className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => deleteGroup(groupIndex)}
                  disabled={groups.length <= 1}
                  aria-label={`Delete ${group.title}`}
                  className="p-1 text-carbon-500 hover:text-rose-600 disabled:opacity-30"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>

              <ul className="min-h-[2rem] py-1">
                {group.items.map((href, itemIndex) => {
                  const meta = NAV_META[href];
                  if (!meta) return null;
                  const Icon = meta.icon;
                  const isTarget =
                    dropTarget?.groupIndex === groupIndex &&
                    dropTarget.index === itemIndex;
                  return (
                    <li
                      key={href}
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.effectAllowed = "move";
                        setDragging(href);
                      }}
                      onDragEnd={() => {
                        setDragging(null);
                        setDropTarget(null);
                      }}
                      onDragOver={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setDropTarget({ groupIndex, index: itemIndex });
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        if (dragging) moveItem(dragging, { groupIndex, index: itemIndex });
                        setDragging(null);
                        setDropTarget(null);
                      }}
                      className={cn(
                        "flex cursor-grab items-center gap-2 px-3 py-1.5 text-sm",
                        dragging === href && "opacity-40",
                        isTarget && "border-t-2 border-signal-500"
                      )}
                    >
                      <GripVertical className="h-4 w-4 shrink-0 text-carbon-300" aria-hidden />
                      <Icon className="h-4 w-4 shrink-0 text-carbon-500" aria-hidden />
                      <span className="flex-1 truncate">{meta.label}</span>
                      <button
                        type="button"
                        onClick={() => nudgeItem(groupIndex, itemIndex, -1)}
                        disabled={groupIndex === 0 && itemIndex === 0}
                        aria-label={`Move ${meta.label} up`}
                        className="p-0.5 text-carbon-400 hover:text-carbon-950 disabled:opacity-30"
                      >
                        <ChevronUp className="h-3.5 w-3.5" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => nudgeItem(groupIndex, itemIndex, 1)}
                        disabled={
                          groupIndex === groups.length - 1 &&
                          itemIndex === group.items.length - 1
                        }
                        aria-label={`Move ${meta.label} down`}
                        className="p-0.5 text-carbon-400 hover:text-carbon-950 disabled:opacity-30"
                      >
                        <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </li>
                  );
                })}
                {group.items.length === 0 ? (
                  <li className="px-3 py-1.5 text-xs text-carbon-400">
                    Drop sections here
                  </li>
                ) : null}
              </ul>
            </section>
          ))}

          <button
            type="button"
            onClick={addGroup}
            className="flex items-center gap-2 text-sm font-medium text-signal-600 hover:underline"
          >
            <Plus className="h-4 w-4" aria-hidden /> Add category
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-carbon-150 px-5 py-4">
          <button
            type="button"
            onClick={() =>
              setGroups(
                layout.groups.map((g) => ({
                  id: g.id,
                  title: g.title,
                  items: [...g.items],
                }))
              )
            }
            className="inline-flex items-center gap-1.5 text-xs font-medium text-carbon-500 hover:text-carbon-950"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Undo changes
          </button>
          <div className="flex items-center gap-3">
            {error ? <p className="text-xs text-rose-600">{error}</p> : null}
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm font-medium text-carbon-500 hover:text-carbon-950"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="border border-carbon-950 bg-signal-500 px-4 py-1.5 text-sm font-semibold text-carbon-950 hover:bg-signal-400 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save menu"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
