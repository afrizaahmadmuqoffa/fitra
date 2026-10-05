import {
  ChartSkeleton,
  PageHeaderSkeleton,
  SkeletonFrame,
  StatGridSkeleton,
} from "@/components/dashboard/skeletons";

/** Kerangka selagi data progres dimuat. */
export default function ProgresLoading() {
  return (
    <SkeletonFrame label="Memuat data progres">
      <PageHeaderSkeleton />
      <StatGridSkeleton count={3} />
      <ChartSkeleton />
    </SkeletonFrame>
  );
}