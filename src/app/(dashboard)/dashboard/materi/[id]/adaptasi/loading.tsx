import {
  PageHeaderSkeleton,
  SkeletonFrame,
  TileGridSkeleton,
} from "@/components/dashboard/skeletons";

/** Kerangka selagi daftar adaptasi per siswa dimuat. */
export default function AdaptasiLoading() {
  return (
    <SkeletonFrame label="Memuat daftar adaptasi">
      <PageHeaderSkeleton />
      <TileGridSkeleton />
    </SkeletonFrame>
  );
}