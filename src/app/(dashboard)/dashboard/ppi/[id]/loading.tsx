import {
  FormSkeleton,
  PageHeaderSkeleton,
  SkeletonFrame,
} from "@/components/dashboard/skeletons";

/** Kerangka selagi editor PPI dimuat. */
export default function PpiEditorLoading() {
  return (
    <SkeletonFrame label="Memuat dokumen PPI">
      <PageHeaderSkeleton />
      <FormSkeleton fields={9} />
    </SkeletonFrame>
  );
}