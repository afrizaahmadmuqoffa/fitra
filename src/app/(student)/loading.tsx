import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton area siswa: kartu besar dengan target sentuh selebar layar. */
export default function StudentLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 px-3 py-6" aria-busy="true">
      <span className="sr-only">Memuat materi</span>
      <Skeleton className="h-10 w-full rounded-[var(--radius-lg)]" />
      <Skeleton className="h-6 w-3/4 rounded-[var(--radius-lg)]" />
      <Skeleton className="h-56 w-full rounded-[var(--radius-lg)]" />
      <Skeleton className="h-56 w-full rounded-[var(--radius-lg)]" />
    </div>
  );
}