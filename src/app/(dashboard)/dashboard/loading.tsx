import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton dasbor guru selagi data dimuat dari database. */
export default function DashboardLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Memuat dasbor</span>
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 w-full rounded-[var(--radius-lg)]" />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-64 w-full rounded-[var(--radius-lg)] lg:col-span-2" />
        <Skeleton className="h-64 w-full rounded-[var(--radius-lg)]" />
      </div>

      <Skeleton className="h-48 w-full rounded-[var(--radius-lg)]" />
    </div>
  );
}