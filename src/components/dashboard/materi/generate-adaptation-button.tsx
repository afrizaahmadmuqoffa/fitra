"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { generateAdaptationAction } from "@/actions/ai";
import { jalankanAction } from "@/lib/action-helpers";

/**
 * Tombol "Buat adaptasi" untuk satu siswa.
 *
 * Satu klik hanya memproses satu siswa, sesuai keputusan proyek: guru yang
 * memilih kapan dan untuk siapa materi dibuat. Panggilan AI bisa memakan
 * waktu beberapa puluh detik, jadi tombol ini menampilkan status sibuk yang jelas
 * dan tidak pernah mengunci halaman.
 */
export function GenerateAdaptationButton({
  materialId,
  studentId,
  studentName,
  sudahAda,
  disabledReason,
}: {
  materialId: string;
  studentId: string;
  studentName: string;
  /** True bila adaptasi sebelumnya sudah pernah dibuat. */
  sudahAda: boolean;
  /** Alasan tombol dimatikan, mis. profil belajar belum lengkap. */
  disabledReason?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function jalankan() {
    setPending(true);
    try {
      const hasil = await jalankanAction(() =>
        generateAdaptationAction({ materialId, studentId }),
      );

      if (!hasil.ok) {
        toast.error("Adaptasi belum bisa dibuat", { description: hasil.message });
        return;
      }

      toast.success(hasil.message, {
        description: "Buka editor untuk meninjau, menyunting, lalu menyetujui.",
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  if (disabledReason) {
    return (
      <Button variant="ghost" size="sm" disabled title={disabledReason}>
        {disabledReason}
      </Button>
    );
  }

  return (
    <Button
      variant={sudahAda ? "outline" : "default"}
      size="sm"
      disabled={pending}
      onClick={jalankan}
      title={
        sudahAda
          ? `Buat versi baru untuk ${studentName}. Versi lama tetap tersimpan.`
          : `Buat versi materi untuk ${studentName}`
      }
    >
      {pending ? (
        <Loader2 className="animate-spin" aria-hidden="true" />
      ) : (
        <Sparkles aria-hidden="true" />
      )}
      {pending ? "Sedang membuat" : sudahAda ? "Buat versi baru" : "Buat adaptasi"}
    </Button>
  );
}
