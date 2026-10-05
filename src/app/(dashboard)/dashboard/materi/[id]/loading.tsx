import {
  CardSkeleton,
  PageHeaderSkeleton,
  SkeletonFrame,
} from "@/components/dashboard/skeletons";

/** Kerangka selagi detail materi dimuat. */
export default function MateriDetailLoading() {
  return (
    <SkeletonFrame label="Memuat detail materi">
      <PageHeaderSkeleton />
      <CardSkeleton height="h-80" />
    </SkeletonFrame>
  );
}