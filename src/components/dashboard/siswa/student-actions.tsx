"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteStudentAction } from "@/actions/students";
import { jalankanAction } from "@/lib/action-helpers";
import type { Student } from "@/db/types";

/**
 * Tombol hapus siswa — ditampilkan langsung tanpa dropdown.
 * Konfirmasi tetap muncul sebelum data dihapus permanen.
 */
export function StudentActions({ student }: { student: Student }) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  async function hapus() {
    setPending(true);
    const result = await jalankanAction(() => deleteStudentAction(student.id));
    setPending(false);

    if (!result.ok) {
      toast.error("Siswa gagal dihapus", { description: result.message });
      return;
    }

    setDeleteOpen(false);
    toast.success(result.message);
    router.push("/dashboard/siswa");
  }

  return (
    <>
      <Button
        variant="destructive"
        onClick={() => setDeleteOpen(true)}
        aria-label={`Hapus ${student.fullName}`}
      >
        <Trash2 aria-hidden />
        Hapus siswa
      </Button>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hapus {student.fullName}?</DialogTitle>
            <DialogDescription>
              Tindakan ini permanen. Semua data siswa ini ikut terhapus:
            </DialogDescription>
          </DialogHeader>

          <ul className="space-y-1.5 text-sm leading-relaxed text-muted-foreground">
            <li>Profil belajar dan ringkasan kemampuannya.</li>
            <li>Keterangan kelas yang pernah diikuti.</li>
            <li>Versi adaptasi materi dan daftar token QR.</li>
            <li>Riwayat sesi belajar serta progres jawaban.</li>
          </ul>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" disabled={pending} onClick={hapus}>
              {pending ? (
                <Loader2 className="animate-spin" aria-hidden />
              ) : (
                <TriangleAlert aria-hidden />
              )}
              Ya, hapus permanen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}