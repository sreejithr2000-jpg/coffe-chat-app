import { Skeleton, SkeletonCalendarGrid, SkeletonCard } from "@/components/ui/Skeleton";

export default function CalendarLoading() {
  return (
    <div className="flex flex-col gap-8">
      {/* Header + view toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-52" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>

      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>

      {/* Calendar grid — hidden on mobile */}
      <div className="hidden sm:block">
        <SkeletonCalendarGrid />
      </div>

      {/* Upcoming sessions list */}
      <div className="flex flex-col gap-4">
        <Skeleton className="h-3 w-32" />
        {[...Array(3)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
