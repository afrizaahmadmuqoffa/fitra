import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton saat halaman sapaan siswa (/belajar/[token]) sedang dimuat. */
export default function StudentEntryLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-7 sm:px-6 sm:py-10" aria-busy="true">
      <span className="sr-only">Memuat ruang belajar</span>

      {/* Hero card */}
      <Skeleton className="h-72 w-full rounded-[2.75rem] bg-white/70 sm:h-80" />

      {/* Stat tiles */}
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <Skeleton className="h-36 rounded-[2rem] bg-white/65" />
        <Skeleton className="h-36 rounded-[2rem] bg-white/65" />
        <Skeleton className="h-36 rounded-[2rem] bg-white/65" />
      </div>

      {/* Caption */}
      <Skeleton className="mx-auto mt-6 h-4 w-64 rounded-full bg-white/50" />
    </div>
  );
}
