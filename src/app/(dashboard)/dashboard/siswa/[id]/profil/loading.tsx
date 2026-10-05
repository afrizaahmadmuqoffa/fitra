import {
  CardSkeleton,
  PageHeaderSkeleton,
  SkeletonFrame,
  TileGridSkeleton,
} from "@/components/dashboard/skeletons";

/** Kerangka selagi pemetaan profil belajar dimuat. */
export default function SiswaProfilLoading() {
  return (
    <SkeletonFrame label="Memuat profil belajar siswa">
      <PageHeaderSkeleton />
      <TileGridSkeleton count={4} />
      <CardSkeleton height="h-64" />
    </SkeletonFrame>
  );
}