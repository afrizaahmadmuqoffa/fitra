import {
  CardSkeleton,
  PageHeaderSkeleton,
  SkeletonFrame,
  TableSkeleton,
} from "@/components/dashboard/skeletons";

/** Kerangka selagi detail kelas dan anggota dimuat. */
export default function KelasDetailLoading() {
  return (
    <SkeletonFrame label="Memuat detail kelas">
      <PageHeaderSkeleton />
      <CardSkeleton height="h-48" />
      <TableSkeleton rows={5} />
    </SkeletonFrame>
  );
}