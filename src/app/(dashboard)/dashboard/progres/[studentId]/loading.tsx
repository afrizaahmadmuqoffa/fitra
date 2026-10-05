import {
  ChartSkeleton,
  PageHeaderSkeleton,
  SkeletonFrame,
  TableSkeleton,
} from "@/components/dashboard/skeletons";

/** Kerangka selagi progres satu siswa dimuat. */
export default function ProgresSiswaLoading() {
  return (
    <SkeletonFrame label="Memuat progres siswa">
      <PageHeaderSkeleton />
      <TableSkeleton rows={5} />
      <ChartSkeleton height="h-64" />
    </SkeletonFrame>
  );
}