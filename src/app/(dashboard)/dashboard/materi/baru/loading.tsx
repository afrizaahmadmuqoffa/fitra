import {
  FormSkeleton,
  PageHeaderSkeleton,
  SkeletonFrame,
} from "@/components/dashboard/skeletons";

/** Kerangka selagi formulir unggah materi siap dirender. */
export default function MateriBaruLoading() {
  return (
    <SkeletonFrame label="Memuat formulir unggah materi">
      <PageHeaderSkeleton />
      <FormSkeleton fields={5} />
    </SkeletonFrame>
  );
}