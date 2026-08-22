import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  animation?: "pulse" | "wave" | "none";
}

export function Skeleton({
  className,
  variant = "text",
  width,
  height,
  animation = "pulse",
}: SkeletonProps) {
  const baseStyles = "bg-surface-container-highest animate-skeleton rounded";

  const variantStyles = {
    text: "h-4 w-full",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  const animationStyles = {
    pulse: "animate-pulse",
    wave: "animate-skeleton-wave",
    none: "",
  };

  const style = {
    width: width ? (typeof width === "number" ? `${width}px` : width) : undefined,
    height: height ? (typeof height === "number" ? `${height}px` : height) : undefined,
  } as React.CSSProperties;

  return (
    <div
      className={cn(baseStyles, variantStyles[variant], animationStyles[animation], className)}
      style={style}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({ lines = 3, className, ...props }: { lines?: number; className?: string } & Omit<SkeletonProps, "variant">) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} variant="text" width={i === lines - 1 ? "60%" : "100%"} {...props} />
      ))}
    </div>
  );
}

export function SkeletonCard({ className, ...props }: { className?: string } & Omit<SkeletonProps, "variant">) {
  return (
    <div className={cn("bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-6 md:p-8 ambient-shadow space-y-5", className)}>
      <Skeleton variant="circular" width={48} height={48} className="w-12 h-12" {...props} />
      <Skeleton variant="text" width="40%" {...props} />
      <Skeleton variant="text" width="60%" {...props} />
      <Skeleton variant="text" width="80%" {...props} />
      <Skeleton variant="rectangular" height={120} className="rounded-lg" {...props} />
      <div className="flex flex-wrap gap-3 pt-2 border-t border-outline-variant/20">
        <Skeleton variant="rectangular" width={120} height={40} {...props} />
        <Skeleton variant="rectangular" width={100} height={40} {...props} />
        <Skeleton variant="rectangular" width={140} height={40} {...props} />
      </div>
    </div>
  );
}

export function SkeletonProgrammeCard({ className, ...props }: { className?: string } & Omit<SkeletonProps, "variant">) {
  return (
    <article className={cn("bg-surface-container-lowest border border-outline-variant/40 rounded-lg p-6 md:p-8 ambient-shadow space-y-5", className)}>
      <div className="flex items-center gap-4 flex-wrap">
        <Skeleton variant="circular" width={56} height={56} className="w-14 h-14" {...props} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="80%" {...props} />
          <Skeleton variant="text" width="100%" {...props} />
        </div>
      </div>

      <div className="space-y-1">
        <Skeleton variant="text" width="50%" {...props} />
        <Skeleton variant="text" width="70%" className="text-headline-sm" {...props} />
        <Skeleton variant="text" width="60%" {...props} />
      </div>

      <div className="flex flex-wrap gap-4">
        <Skeleton variant="rectangular" width={100} height={28} {...props} />
        <Skeleton variant="rectangular" width={100} height={28} {...props} />
        <Skeleton variant="rectangular" width={100} height={28} {...props} />
      </div>

      <Skeleton variant="text" width="100%" {...props} />

      <div className="space-y-1">
        <Skeleton variant="text" width="100%" {...props} />
        <Skeleton variant="text" width="100%" {...props} />
      </div>

      <div className="space-y-1">
        <Skeleton variant="text" width="100%" {...props} />
        <Skeleton variant="text" width="100%" {...props} />
      </div>

      <div className="flex flex-wrap gap-3 pt-2 border-t border-outline-variant/20">
        <Skeleton variant="rectangular" width={160} height={44} {...props} />
        <Skeleton variant="rectangular" width={100} height={44} {...props} />
        <Skeleton variant="rectangular" width={120} height={44} {...props} />
      </div>
    </article>
  );
}

export function SkeletonUniversityCard({ className, ...props }: { className?: string } & Omit<SkeletonProps, "variant">) {
  return (
    <div className={cn("bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-6 space-y-6", className)}>
      <div className="flex items-start gap-4">
        <Skeleton variant="circular" width={80} height={80} className="w-20 h-20" {...props} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" className="text-headline-lg" {...props} />
          <Skeleton variant="text" width="40%" {...props} />
          <Skeleton variant="text" width="50%" {...props} />
        </div>
      </div>

      <div className="space-y-3">
        <Skeleton variant="text" width="70%" {...props} />
        <Skeleton variant="text" width="50%" {...props} />
        <Skeleton variant="text" width="60%" {...props} />
      </div>

      <div className="pt-4 border-t border-outline-variant/40 space-y-2">
        <Skeleton variant="rectangular" width={160} height={44} {...props} />
        <Skeleton variant="rectangular" width={200} height={44} {...props} />
      </div>
    </div>
  );
}

export function SkeletonDiscoverFilters({ className, ...props }: { className?: string } & Omit<SkeletonProps, "variant">) {
  return (
    <div className={cn("flex flex-wrap gap-4 mb-8", className)}>
      <Skeleton variant="rectangular" width={200} height={44} {...props} />
      <Skeleton variant="rectangular" width={200} height={44} {...props} />
      <Skeleton variant="rectangular" width={200} height={44} {...props} />
      <Skeleton variant="rectangular" width={200} height={44} {...props} />
    </div>
  );
}