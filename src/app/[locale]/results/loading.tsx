import { ResultsSkeleton } from "@/components/skeleton-wrappers";

export default function ResultsLoading() {
  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 space-y-8">
      <div className="space-y-2">
        <div className="h-10 w-72 bg-surface-container-high rounded animate-pulse" />
        <div className="h-5 w-full max-w-lg bg-surface-container-high rounded animate-pulse" />
      </div>
      <ResultsSkeleton />
    </main>
  );
}