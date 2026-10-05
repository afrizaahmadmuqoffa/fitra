import {
  PageHeaderSkeleton,
  SkeletonFrame,
  TileGridSkeleton,
} from "@/components/dashboard/skeletons";

/** Kerangka selagi daftar siswa dimuat. */
export default function SiswaLoading() {
  return (
    <SkeletonFrame label="Memuat daftar siswa">
      <PageHeaderSkeleton />
      <TileGridSkeleton />
    </SkeletonFrame>
  );
}