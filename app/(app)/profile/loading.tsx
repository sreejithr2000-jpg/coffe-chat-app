import { Skeleton, SkeletonProfileHeader, SkeletonSection } from "@/components/ui/Skeleton";

export default function ProfileLoading() {
  return (
    <div className="flex flex-col gap-6">
      <SkeletonProfileHeader />

      {/* Completion bar */}
      <div className="rounded-2xl border border-neutral-100 bg-white px-6 py-4 shadow-soft">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3.5 w-36" />
          <Skeleton className="h-3.5 w-12" />
        </div>
        <Skeleton className="mt-3 h-2 w-full rounded-full" />
      </div>

      {/* Two column */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SkeletonSection rows={4} />
        <SkeletonSection rows={3} />
      </div>

      <SkeletonSection rows={5} />
    </div>
  );
}
