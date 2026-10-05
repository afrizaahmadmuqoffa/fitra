import {
  CardSkeleton,
  PageHeaderSkeleton,
  SkeletonFrame,
  StatGridSkeleton,
} from "@/components/dashboard/skeletons";

/** Skeleton dasbor guru selagi data dimuat dari database. */
export default function DashboardLoading() {
  return (
    <SkeletonFrame label="Memuat dasbor">
      <PageHeaderSkeleton />
      <StatGridSkeleton />
      <div className="grid gap-4 lg:grid-cols-3">
        <CardSkeleton height="h-64 lg:col-span-2" />
        <CardSkeleton height="h-64" />
      </div>
    </SkeletonFrame>
  );
}