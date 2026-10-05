import type * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Kerangka abu-abu untuk `loading.tsx`.
 *
 * Semua halaman dasbor memanggil query database di server component, jadi
 * perpindahan rute selalu menunggu network. Tanpa `loading.tsx` tiap rute
 * menampilkan halaman kosong lalu melompat ke isi, yang terasa seperti lag.
 * Komponen ini dipakai bersama supaya bentuk kerangka konsisten antar halaman.
 */

const RADIUS = "rounded-[var(--radius-lg)]";

/** Bungkus kerangka dengan pengumuman terbaca screen reader. */
export function SkeletonFrame({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/** Judul halaman, deskripsi, dan tempat tombol aksi. */
export function PageHeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-96 max-w-full" />
    </div>
  );
}

/** Deretan kartu statistik di dasbor. */
export function StatGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className={`h-28 w-full ${RADIUS}`} />
      ))}
    </div>
  );
}

/** Kartu dengan judul dan paragraf, untuk daftar atau panel. */
export function CardSkeleton({ height = "h-48" }: { height?: string }) {
  return <Skeleton className={`w-full ${height} ${RADIUS}`} />;
}

/** Baris tabel untuk halaman daftar berbasis tabel seperti PPI. */
export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className={`space-y-3 rounded-[var(--radius-lg)] border p-4`}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-4">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="hidden h-4 w-28 sm:block" />
          <Skeleton className="h-4 w-20 shrink-0" />
        </div>
      ))}
    </div>
  );
}

/** Kartu bergaya tombol untuk halaman dashboard/siswa dan dashboard/kelas. */
export function TileGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`space-y-3 rounded-[var(--radius-lg)] border p-5`}
        >
          <div className="flex items-center gap-3">
            <Skeleton className="size-12 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      ))}
    </div>
  );
}

/** Kolom isian untuk halaman wizard dan form. */
export function FormSkeleton({ fields = 6 }: { fields?: number }) {
  return (
    <div className="space-y-5 rounded-[var(--radius-lg)] border p-6">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex justify-end gap-2 pt-2">
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}

/** Panel grafik untuk halaman progres. */
export function ChartSkeleton({ height = "h-72" }: { height?: string }) {
  return (
    <div className={`grid gap-4 lg:grid-cols-2 ${height}`}>
      <Skeleton className={`w-full ${RADIUS}`} />
      <Skeleton className={`w-full ${RADIUS}`} />
    </div>
  );
}

/** Editor materi: blok teks panjang dengan sisipan gambar. */
export function ContentSkeleton() {
  return (
    <div className="space-y-4 rounded-[var(--radius-lg)] border p-6">
      <Skeleton className="h-7 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="mx-auto aspect-16/9 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  );
}