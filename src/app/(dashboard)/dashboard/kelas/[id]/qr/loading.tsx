import {
  CardSkeleton,
  PageHeaderSkeleton,
  SkeletonFrame,
  TileGridSkeleton,
} from "@/components/dashboard/skeletons";

/** Kerangka selagi papan QR dimuat. */
export default function QrLoading() {
  return (
    <SkeletonFrame label="Memuat papan QR">
      <PageHeaderSkeleton />
      <CardSkeleton height="h-40" />
      <TileGridSkeleton count={3} />
    </SkeletonFrame>
  );
}