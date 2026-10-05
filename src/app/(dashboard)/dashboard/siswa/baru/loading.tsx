import {
  FormSkeleton,
  PageHeaderSkeleton,
  SkeletonFrame,
} from "@/components/dashboard/skeletons";

/** Kerangka selagi wizard siswa baru siap dirender. */
export default function SiswaBaruLoading() {
  return (
    <SkeletonFrame label="Memuat formulir siswa">
      <PageHeaderSkeleton />
      <FormSkeleton />
    </SkeletonFrame>
  );
}