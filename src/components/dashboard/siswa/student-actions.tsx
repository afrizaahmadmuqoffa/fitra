"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, MoreHorizontal, Pencil, Trash2, TriangleAlert } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StudentIdentityForm } from "@/components/dashboard/siswa/student-identity-form";
import { deleteStudentAction } from "@/actions/students";
import { jalankanAction } from "@/lib/action-helpers";
import type { Student } from "@/db/types";

/**
 * Aksi siswa pada halaman detail: ubah identitas dan hapus siswa.
 *
 * Menghapus siswa bersifat permanen dan berantai: profil belajar,
 * keanggotaan kelas, versi adaptasi, token QR, serta riwayat belajar dan
 * progres ikut terhapus. Karena itu konfirmasi menyebutkan semua konsekuensinya.
 */
export function StudentActions({ student }: { student: Student }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = React.useState(false);
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
    router.refresh();
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" aria-label={`Aksi untuk ${student.fullName}`}>
            <MoreHorizontal aria-hidden />
            Kelola
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Aksi siswa</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil aria-hidden />
            Ubah identitas
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setDeleteOpen(true)}
          >
            <Trash2 aria-hidden />
            Hapus siswa
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Ubah identitas {student.fullName}</DialogTitle>
            <DialogDescription>
              Kelas, profil belajar, dan materi tidak ikut berubah di sini.
              Perubahan tingkat kemampuan ada di halaman Profil Belajar.
            </DialogDescription>
          </DialogHeader>
          <StudentIdentityForm
            student={student}
            onDone={() => {
              setEditOpen(false);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>

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