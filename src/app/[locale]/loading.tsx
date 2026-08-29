/** Loading UI shown during route transitions (locale navigation, etc.) */
export default function LocaleLoading() {
  return (
    <div className="min-h-screen bg-surface" aria-busy="true" aria-live="polite">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 space-y-8">
        {/* Page heading skeleton */}
        <div className="space-y-3">
          <div className="h-10 w-64 rounded-lg bg-surface-container animate-pulse" />
          <div className="h-5 w-96 rounded-lg bg-surface-container animate-pulse" />
        </div>

        {/* Content skeletons */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-outline-variant/40 bg-surface-container-low p-4 space-y-3">
              <div className="h-5 w-3/4 rounded bg-surface-container animate-pulse" />
              <div className="h-4 w-1/2 rounded bg-surface-container animate-pulse" />
              <div className="h-4 w-2/3 rounded bg-surface-container animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
