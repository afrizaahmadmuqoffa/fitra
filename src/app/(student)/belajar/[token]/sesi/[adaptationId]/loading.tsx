import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton saat halaman materi adaptif sedang dimuat. */
export default function StudentAdaptasiLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-7 sm:px-6 sm:py-10" aria-busy="true">
      <span className="sr-only">Memuat materi belajar</span>

      {/* Progress bar */}
      <Skeleton className="h-2 w-full rounded-full bg-white/55" />

      {/* Section card */}
      <div className="mt-6 space-y-4">
        <Skeleton className="h-8 w-2/3 rounded-2xl bg-white/70" />
        <Skeleton className="h-48 w-full rounded-[2.25rem] bg-white/70" />
        <Skeleton className="h-5 w-full rounded-full bg-white/55" />
        <Skeleton className="h-5 w-4/5 rounded-full bg-white/55" />
        <Skeleton className="h-5 w-3/4 rounded-full bg-white/55" />
      </div>

      {/* Interaction area */}
      <div className="mt-6 space-y-3">
        <Skeleton className="h-6 w-1/2 rounded-xl bg-white/60" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-16 rounded-2xl bg-white/65" />
          <Skeleton className="h-16 rounded-2xl bg-white/65" />
          <Skeleton className="h-16 rounded-2xl bg-white/65" />
          <Skeleton className="h-16 rounded-2xl bg-white/65" />
        </div>
      </div>

      {/* Audio controls */}
      <Skeleton className="mt-6 h-24 w-full rounded-[2.25rem] bg-white/65" />
    </div>
  );
}
