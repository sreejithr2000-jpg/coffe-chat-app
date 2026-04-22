import { Skeleton, SkeletonProfileHeader, SkeletonSection } from "@/components/ui/Skeleton";

export default function BookingLoading() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <SkeletonProfileHeader />

      <SkeletonSection rows={3} />

      {/* Time slot picker */}
      <div className="rounded-2xl border border-neutral-100 bg-white px-6 py-5 shadow-soft">
        <Skeleton className="mb-4 h-3 w-24" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-10 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Message input */}
      <div className="rounded-2xl border border-neutral-100 bg-white px-6 py-5 shadow-soft">
        <Skeleton className="mb-3 h-3 w-20" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>

      {/* Submit button */}
      <Skeleton className="h-11 w-full rounded-xl" />
    </div>
  );
}
