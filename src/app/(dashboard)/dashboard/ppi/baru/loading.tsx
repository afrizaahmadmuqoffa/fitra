import {
  FormSkeleton,
  PageHeaderSkeleton,
  SkeletonFrame,
} from "@/components/dashboard/skeletons";

/** Kerangka selagi wizard PPI baru siap dirender. */
export default function PpiBaruLoading() {
  return (
    <SkeletonFrame label="Memuat formulir PPI">
      <PageHeaderSkeleton />
      <FormSkeleton fields={7} />
    </SkeletonFrame>
  );
}