import { SkeletonCard } from "@/components/skeleton";

export default function SavedLoading() {
  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 space-y-8">
      <div className="space-y-2">
        <div className="h-10 w-56 bg-surface-container-high rounded animate-pulse" />
      </div>
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </main>
  );
}