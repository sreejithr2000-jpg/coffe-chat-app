import { Skeleton } from "@/components/ui/Skeleton";

function SkeletonReviewCard() {
  return (
    <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-4 w-4 rounded-full" />
            ))}
          </div>
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-3 w-16 shrink-0" />
      </div>
      <div className="mt-4 flex flex-col gap-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-3/5" />
      </div>
      <div className="mt-3 flex gap-2">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  );
}

export default function ReviewsLoading() {
  return (
    <div className="flex flex-col gap-8">
      {/* Header + stats */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Skeleton className="h-7 w-36" />
        <div className="flex gap-3">
          <Skeleton className="h-8 w-20 rounded-xl" />
          <Skeleton className="h-8 w-20 rounded-xl" />
          <Skeleton className="h-8 w-20 rounded-xl" />
        </div>
      </div>

      {/* Rating summary */}
      <div className="rounded-2xl border border-neutral-100 bg-white px-6 py-5 shadow-soft">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-16" />
          <div className="flex flex-col gap-2">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-5 w-5 rounded-full" />
              ))}
            </div>
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
      </div>

      {/* Review cards */}
      <div className="flex flex-col gap-4">
        {[...Array(4)].map((_, i) => (
          <SkeletonReviewCard key={i} />
        ))}
      </div>
    </div>
  );
}
