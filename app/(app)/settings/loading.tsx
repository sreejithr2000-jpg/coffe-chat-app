import { Skeleton, SkeletonSection } from "@/components/ui/Skeleton";

export default function SettingsLoading() {
  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-56" />
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-6">
        <SkeletonSection rows={3} />
        <SkeletonSection rows={2} />
        <SkeletonSection rows={4} />
      </div>
    </div>
  );
}
