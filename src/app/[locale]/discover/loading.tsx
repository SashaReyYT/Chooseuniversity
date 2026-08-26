import { DiscoverSkeleton } from "@/components/skeleton-wrappers";

export default function DiscoverLoading() {
  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 space-y-8">
      <div className="space-y-2">
        <div className="h-10 w-64 bg-surface-container-high rounded animate-pulse" />
        <div className="h-5 w-96 bg-surface-container-high rounded animate-pulse" />
      </div>
      <DiscoverSkeleton />
    </main>
  );
}