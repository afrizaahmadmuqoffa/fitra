import {
  ContentSkeleton,
  PageHeaderSkeleton,
  SkeletonFrame,
} from "@/components/dashboard/skeletons";

/** Kerangka selagi editor adaptasi dimuat. */
export default function AdaptasiEditorLoading() {
  return (
    <SkeletonFrame label="Memuat editor adaptasi">
      <PageHeaderSkeleton />
      <ContentSkeleton />
    </SkeletonFrame>
  );
}