import { Skeleton } from "@/components/ui/skeleton";

/** Kerangka selagi halaman masuk dirender. */
export default function MasukLoading() {
  return (
    <div
      className="w-full space-y-4"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Memuat halaman masuk</span>
      <div className="rounded-xl border-2 bg-card p-6 shadow-sm">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-11 w-full" />
          <div className="flex items-center gap-3 py-1">
            <Skeleton className="h-px flex-1" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-px flex-1" />
          </div>
          <Skeleton className="h-11 w-full" />
        </div>
      </div>
    </div>
  );
}