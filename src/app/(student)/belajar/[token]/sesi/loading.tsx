import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton saat daftar materi (/belajar/[token]/sesi) sedang dimuat. */
export default function StudentSesiLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-7 sm:px-6 sm:py-10" aria-busy="true">
      <span className="sr-only">Memuat daftar materi</span>

      {/* Header */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-28 rounded-full bg-white/60" />
        <Skeleton className="h-12 w-3/4 rounded-2xl bg-white/70" />
        <Skeleton className="h-5 w-1/2 rounded-full bg-white/55" />
      </div>

      {/* Materi cards */}
      <div className="mt-7 space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 w-full rounded-[2.25rem] bg-white/70" />
        ))}
      </div>

      {/* Footer stats */}
      <Skeleton className="mt-6 h-28 w-full rounded-[2.25rem] bg-white/65" />
    </div>
  );
}
