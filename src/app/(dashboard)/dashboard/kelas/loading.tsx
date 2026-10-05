import {
  PageHeaderSkeleton,
  SkeletonFrame,
  TileGridSkeleton,
} from "@/components/dashboard/skeletons";

/** Kerangka selagi daftar kelas dimuat. */
export default function KelasLoading() {
  return (
    <SkeletonFrame label="Memuat daftar kelas">
      <PageHeaderSkeleton />
      <TileGridSkeleton />
    </SkeletonFrame>
  );
}