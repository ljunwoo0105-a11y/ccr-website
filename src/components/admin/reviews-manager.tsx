"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Plus,
  RefreshCw,
  Star,
  Trash2,
} from "lucide-react";
import { cn, formatDate, formatDateTime } from "@/lib/utils";
import { manualReviewSchema } from "@/lib/validation";
import { Modal } from "@/components/admin/modal";
import { Switch } from "@/components/admin/switch";
import { apiFetch, apiJson } from "@/components/admin/shared";

interface ReviewRow {
  id: string;
  source: string;
  authorName: string;
  rating: number;
  text: string;
  reviewedAt: string | null;
  visible: boolean;
  createdAt: string;
}

interface SyncResult {
  ok: boolean;
  message: string;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span
      className="inline-flex"
      role="img"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          aria-hidden
          className={cn(
            "h-4 w-4",
            i <= rating
              ? "fill-orange-500 text-orange-500"
              : "fill-slate-200 text-slate-200"
          )}
        />
      ))}
    </span>
  );
}

interface AddForm {
  authorName: string;
  rating: number;
  text: string;
  date: string;
  visible: boolean;
}

const EMPTY_ADD_FORM: AddForm = {
  authorName: "",
  rating: 5,
  text: "",
  date: "",
  visible: true,
};

export function ReviewsManager({
  aggregate,
  lastSyncAt,
}: {
  aggregate: { rating: number; reviewCount: number };
  lastSyncAt: string | null;
}) {
  const router = useRouter();
  const [reviews, setReviews] = useState<ReviewRow[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<SyncResult | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addForm, setAddForm] = useState<AddForm | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const result = await apiFetch<ReviewRow[]>("/api/admin/reviews");
    if (result.ok) {
      setReviews(result.data);
      setListError(null);
    } else {
      setListError(result.error);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function sync() {
    setSyncing(true);
    setSyncMsg(null);
    const result = await apiFetch<SyncResult>("/api/admin/reviews/sync", {
      method: "POST",
    });
    setSyncing(false);
    if (!result.ok) {
      setSyncMsg({ ok: false, message: result.error });
      return;
    }
    setSyncMsg(result.data);
    if (result.data.ok) {
      await load();
      router.refresh(); // refresh aggregate + last-sync props
    }
  }

  async function toggleVisible(r: ReviewRow) {
    const result = await apiFetch<ReviewRow>(
      `/api/admin/reviews/${r.id}`,
      apiJson("PATCH", { visible: !r.visible })
    );
    if (!result.ok) {
      setListError(result.error);
      return;
    }
    setReviews((prev) =>
      prev
        ? prev.map((x) =>
            x.id === r.id ? { ...x, visible: !r.visible } : x
          )
        : prev
    );
  }

  async function deleteReview(r: ReviewRow) {
    if (
      !window.confirm(
        `Delete the manual review from "${r.authorName}"? This can't be undone.`
      )
    ) {
      return;
    }
    const result = await apiFetch<{ deleted: boolean }>(
      `/api/admin/reviews/${r.id}`,
      { method: "DELETE" }
    );
    if (!result.ok) {
      setListError(result.error);
      return;
    }
    await load();
  }

  async function submitAdd() {
    if (!addForm) return;
    const payload: Record<string, unknown> = {
      authorName: addForm.authorName,
      rating: addForm.rating,
      text: addForm.text,
      visible: addForm.visible,
    };
    if (addForm.date) {
      // Midday local avoids the date slipping a day across timezones.
      payload.reviewedAt = new Date(
        `${addForm.date}T12:00:00`
      ).toISOString();
    }
    const parsed = manualReviewSchema.safeParse(payload);
    if (!parsed.success) {
      const issue = parsed.error.errors[0];
      setAddError(`${issue.path.join(".")}: ${issue.message}`);
      return;
    }
    setBusy(true);
    const result = await apiFetch<ReviewRow>(
      "/api/admin/reviews",
      apiJson("POST", parsed.data)
    );
    setBusy(false);
    if (!result.ok) {
      setAddError(result.error);
      return;
    }
    setAddForm(null);
    setAddError(null);
    await load();
  }

  return (
    <div className="space-y-6">
      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Google rating
              </p>
              <p className="mt-1 flex items-center gap-2 text-2xl font-bold text-slate-900">
                {aggregate.rating.toFixed(1)}
                <Star
                  className="h-5 w-5 fill-orange-500 text-orange-500"
                  aria-hidden
                />
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Google reviews
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {aggregate.reviewCount.toLocaleString("en-AU")}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Last sync</p>
              <p className="mt-1 text-sm text-slate-700">
                {lastSyncAt ? formatDateTime(lastSyncAt) : "Never synced"}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={sync}
            disabled={syncing}
          >
            <RefreshCw
              className={cn("h-4 w-4", syncing && "animate-spin")}
              aria-hidden
            />
            {syncing ? "Syncing…" : "Sync from Google"}
          </button>
        </div>
        {syncMsg && (
          <p
            role="status"
            className={cn(
              "mt-4 rounded-lg px-3 py-2 text-sm",
              syncMsg.ok
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-800"
            )}
          >
            {syncMsg.message}
          </p>
        )}
        <p className="mt-4 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">
          The public site only ever shows 5-star reviews that are marked
          visible.
        </p>
      </section>

      <section className="card p-0">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            All reviews
          </h2>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              setAddError(null);
              setAddForm(EMPTY_ADD_FORM);
            }}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add review manually
          </button>
        </div>

        {listError && (
          <p className="border-b border-red-100 bg-red-50 px-6 py-3 text-sm text-red-700">
            {listError}
          </p>
        )}

        {reviews === null ? (
          <p className="px-6 py-8 text-sm text-slate-500">Loading reviews…</p>
        ) : reviews.length === 0 ? (
          <p className="px-6 py-8 text-sm text-slate-500">
            No reviews stored yet — run a Google sync or add a genuine review
            manually.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-6 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Author</th>
                  <th className="px-4 py-3 font-medium">Rating</th>
                  <th className="px-4 py-3 font-medium">Review</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Visible</th>
                  <th className="px-4 py-3 font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((r) => {
                  const expanded = expandedId === r.id;
                  const long = r.text.length > 140;
                  return (
                    <tr
                      key={r.id}
                      className="border-b border-slate-100 align-top last:border-0"
                    >
                      <td className="px-6 py-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                            r.source === "GOOGLE"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-600"
                          )}
                        >
                          {r.source}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                        {r.authorName}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Stars rating={r.rating} />
                      </td>
                      <td className="min-w-[16rem] max-w-md px-4 py-3 text-slate-600">
                        <p className={cn(!expanded && "line-clamp-2")}>
                          {r.text}
                        </p>
                        {long && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedId(expanded ? null : r.id)
                            }
                            className="mt-1 text-xs font-medium text-ccr-primary hover:underline"
                          >
                            {expanded ? "Show less" : "Show more"}
                          </button>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                        {formatDate(r.reviewedAt ?? r.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Switch
                          checked={r.visible}
                          onChange={() => toggleVisible(r)}
                          label={`Review from ${r.authorName} visible on public site`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        {r.source === "MANUAL" ? (
                          <button
                            type="button"
                            onClick={() => deleteReview(r)}
                            aria-label={`Delete review from ${r.authorName}`}
                            className="rounded p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden />
                          </button>
                        ) : (
                          <span
                            className="text-xs text-slate-400"
                            title="Google reviews can't be deleted — use the visible toggle to hide them"
                          >
                            hide only
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {addForm && (
        <Modal title="Add review manually" onClose={() => setAddForm(null)}>
          <p className="mb-4 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            Only add genuine customer reviews — fake reviews breach Australian
            Consumer Law.
          </p>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void submitAdd();
            }}
          >
            <div>
              <label className="label" htmlFor="review-author">
                Customer name
              </label>
              <input
                id="review-author"
                className="input"
                value={addForm.authorName}
                onChange={(e) =>
                  setAddForm({ ...addForm, authorName: e.target.value })
                }
                required
              />
            </div>
            <div>
              <span className="label">Rating</span>
              <div
                className="flex gap-1"
                role="radiogroup"
                aria-label="Star rating"
              >
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    role="radio"
                    aria-checked={addForm.rating === i}
                    aria-label={`${i} star${i === 1 ? "" : "s"}`}
                    onClick={() => setAddForm({ ...addForm, rating: i })}
                    className="rounded p-0.5 focus:outline-none focus:ring-2 focus:ring-ccr-primary/40"
                  >
                    <Star
                      aria-hidden
                      className={cn(
                        "h-7 w-7 transition",
                        i <= addForm.rating
                          ? "fill-orange-500 text-orange-500"
                          : "fill-slate-200 text-slate-200 hover:fill-orange-200 hover:text-orange-200"
                      )}
                    />
                  </button>
                ))}
              </div>
              {addForm.rating < 5 && (
                <p className="mt-1 text-xs text-slate-400">
                  Reviews under 5 stars are stored but never shown publicly.
                </p>
              )}
            </div>
            <div>
              <label className="label" htmlFor="review-text">
                Review text
              </label>
              <textarea
                id="review-text"
                className="input min-h-[7rem]"
                value={addForm.text}
                onChange={(e) =>
                  setAddForm({ ...addForm, text: e.target.value })
                }
                placeholder="What the customer actually said (Facebook, in-store feedback…)"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="review-date">
                Review date{" "}
                <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                id="review-date"
                className="input"
                type="date"
                value={addForm.date}
                onChange={(e) =>
                  setAddForm({ ...addForm, date: e.target.value })
                }
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={addForm.visible}
                onChange={(v) => setAddForm({ ...addForm, visible: v })}
                label="Visible on public site"
              />
              <span className="text-sm text-slate-700">
                Visible on the public site (5-star only)
              </span>
            </div>

            {addError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {addError}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setAddForm(null)}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={busy}>
                {busy ? "Saving…" : "Add review"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
