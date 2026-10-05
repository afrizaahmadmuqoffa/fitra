import {
  CardSkeleton,
  FormSkeleton,
  PageHeaderSkeleton,
  SkeletonFrame,
} from "@/components/dashboard/skeletons";

/** Kerangka selagi halaman pengaturan dimuat. */
export default function PengaturanLoading() {
  return (
    <SkeletonFrame label="Memuat pengaturan akun">
      <PageHeaderSkeleton />
      <FormSkeleton fields={5} />
      <CardSkeleton height="h-56" />
    </SkeletonFrame>
  );
}