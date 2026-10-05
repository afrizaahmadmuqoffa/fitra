import {
  CardSkeleton,
  PageHeaderSkeleton,
  SkeletonFrame,
  StatGridSkeleton,
} from "@/components/dashboard/skeletons";

/** Kerangka selagi detail siswa dimuat. */
export default function SiswaDetailLoading() {
  return (
    <SkeletonFrame label="Memuat profil siswa">
      <PageHeaderSkeleton />
      <StatGridSkeleton count={3} />
      <CardSkeleton height="h-72" />
    </SkeletonFrame>
  );
}