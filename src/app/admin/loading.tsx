/**
 * Instant feedback for every admin section change. The console's pages are
 * force-dynamic server components, so without this the previous page just
 * freezes while the next one renders (worst on first-visit compiles in dev).
 */
export default function AdminSectionLoading() {
  return (
    <div className="space-y-8" role="status" aria-label="Loading section">
      <div>
        <div className="h-7 w-48 animate-pulse rounded bg-bone-200" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded bg-bone-200" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card">
            <div className="h-4 w-28 animate-pulse rounded bg-bone-200" />
            <div className="mt-3 h-8 w-20 animate-pulse rounded bg-bone-200" />
          </div>
        ))}
      </div>
      <div className="card p-0">
        <div className="border-b border-carbon-150 px-6 py-4">
          <div className="h-5 w-40 animate-pulse rounded bg-bone-200" />
        </div>
        <div className="space-y-3 px-6 py-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 w-full animate-pulse rounded bg-bone-200" />
          ))}
        </div>
      </div>
    </div>
  );
}
