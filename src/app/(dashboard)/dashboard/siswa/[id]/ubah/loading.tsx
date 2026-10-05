import {
  FormSkeleton,
  PageHeaderSkeleton,
  SkeletonFrame,
} from "@/components/dashboard/skeletons";

/** Kerangka selagi formulir ubah siswa siap dirender. */
export default function SiswaUbahLoading() {
  return (
    <SkeletonFrame label="Memuat formulir ubah siswa">
      <PageHeaderSkeleton />
      <FormSkeleton fields={8} />
    </SkeletonFrame>
  );
}