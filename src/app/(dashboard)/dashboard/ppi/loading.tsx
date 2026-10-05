import {
  PageHeaderSkeleton,
  SkeletonFrame,
  TableSkeleton,
} from "@/components/dashboard/skeletons";

/** Kerangka selagi daftar dokumen PPI dimuat. */
export default function PpiLoading() {
  return (
    <SkeletonFrame label="Memuat dokumen PPI">
      <PageHeaderSkeleton />
      <TableSkeleton />
    </SkeletonFrame>
  );
}