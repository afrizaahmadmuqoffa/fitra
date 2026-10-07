import { Skeleton } from "@/components/ui/skeleton";

export default function StudentLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10" aria-busy="true">
      <span className="sr-only">Memuat ruang belajar</span>
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-9 w-32 rounded-2xl bg-white/70" />
        <Skeleton className="size-10 rounded-2xl bg-white/70" />
      </div>
      <Skeleton className="h-48 w-full rounded-[2rem] bg-white/70" />
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <Skeleton className="h-36 rounded-[1.75rem] bg-white/65" />
        <Skeleton className="h-36 rounded-[1.75rem] bg-white/65" />
        <Skeleton className="h-36 rounded-[1.75rem] bg-white/65" />
      </div>
    </div>
  );
}
