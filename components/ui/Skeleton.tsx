import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-lg bg-neutral-100", className)} />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-neutral-100 bg-white p-5 shadow-card", className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-8 flex-1 rounded-xl" />
        <Skeleton className="h-8 flex-1 rounded-xl" />
        <Skeleton className="h-8 w-16 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonLine({ className }: { className?: string }) {
  return <Skeleton className={cn("h-3.5 w-full", className)} />;
}

export function SkeletonProfileHeader() {
  return (
    <div className="rounded-2xl border border-neutral-100 bg-white px-6 py-6 shadow-soft">
      <div className="flex items-start gap-4">
        <Skeleton className="h-[60px] w-[60px] shrink-0 rounded-2xl" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3.5 w-56" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-8 w-24 shrink-0 rounded-lg" />
      </div>
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-5 w-28 rounded-full" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonSection({ rows = 3 }: { rows?: number }) {
  return (
    <div className="rounded-2xl border border-neutral-100 bg-white px-6 py-5 shadow-soft">
      <Skeleton className="mb-4 h-3 w-20" />
      <div className="flex flex-col gap-2.5">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className={`h-3.5 ${i === rows - 1 ? "w-3/5" : "w-full"}`} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonCalendarGrid() {
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-1.5">
          <Skeleton className="h-12 rounded-lg" />
          <Skeleton className="h-10 rounded-xl" />
        </div>
      ))}
    </div>
  );
}
