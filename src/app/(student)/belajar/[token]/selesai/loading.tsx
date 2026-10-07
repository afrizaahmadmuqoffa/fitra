import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton saat halaman ringkasan sesi sedang dimuat. */
export default function StudentSelesaiLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-7 sm:px-6 sm:py-10" aria-busy="true">
      <span className="sr-only">Memuat ringkasan sesi</span>

      {/* Hero */}
      <Skeleton className="h-64 w-full rounded-[2.75rem] bg-white/70" />

      {/* Stat row */}
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-28 rounded-[2rem] bg-white/65" />
        <Skeleton className="h-28 rounded-[2rem] bg-white/65" />
        <Skeleton className="h-28 rounded-[2rem] bg-white/65" />
      </div>

      {/* CTA button */}
      <Skeleton className="mx-auto mt-6 h-14 w-56 rounded-2xl bg-white/65" />
    </div>
  );
}
