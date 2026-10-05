import {
  CardSkeleton,
  PageHeaderSkeleton,
  SkeletonFrame,
} from "@/components/dashboard/skeletons";

/** Kerangka selagi daftar materi dimuat. */
export default function MateriLoading() {
  return (
    <SkeletonFrame label="Memuat daftar materi">
      <PageHeaderSkeleton />
      <CardSkeleton height="h-64" />
    </SkeletonFrame>
  );
}