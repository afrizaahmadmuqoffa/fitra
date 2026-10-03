"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { setClassStudentsAction } from "@/actions/students";
import { jalankanAction } from "@/lib/action-helpers";
import { DISABILITY_LABELS } from "@/lib/constants";
import type { ClassRoom, Student } from "@/db/types";

/**
 * Kelola anggota kelas: centang siswa yang boleh masuk ke kelas ini.
 *
 * Satu siswa boleh mengikuti beberapa kelas, jadi kelas lain tidak tersentuh.
 */
export function ClassMembersManager({
  classRoom,
  members,
  allStudents,
}: {
  classRoom: ClassRoom;
  members: Student[];
  allStudents: Student[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState<string[]>([]);

  const memberIds = React.useMemo(
    () => new Set(members.map((member) => member.id)),
    [members],
  );

  const filtered = allStudents.filter((student) =>
    student.fullName.toLowerCase().includes(search.trim().toLowerCase()),
  );

  function toggle(id: string, checked: boolean) {
    setSelected((current) =>
      checked ? [...new Set([...current, id])] : current.filter((item) => item !== id),
    );
  }

  async function simpan() {
    setPending(true);
    const result = await jalankanAction(() =>
      setClassStudentsAction({ classId: classRoom.id, studentIds: selected }),
    );
    setPending(false);

    if (!result.ok) {
      toast.error("Anggota kelas belum tersimpan", { description: result.message });
      return;
    }
    toast.success(result.message);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => {
          setSelected(members.map((member) => member.id));
          setSearch("");
          setOpen(true);
        }}
      >
        <Users aria-hidden />
        Kelola anggota
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Anggota kelas {classRoom.name}</DialogTitle>
            <DialogDescription>
              Centang siswa yang boleh mengikuti kelas ini. Perubahan disimpan
              saat Anda menekan Simpan, dan kelas lain tidak ikut berubah.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="cari-siswa">Cari siswa</Label>
              <Input
                id="cari-siswa"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Ketik nama siswa"
              />
            </div>

            <ul className="max-h-80 space-y-1.5 overflow-y-auto rounded-lg border p-2">
              {filtered.length === 0 ? (
                <li className="px-2 py-6 text-center text-sm text-muted-foreground">
                  Tidak ada siswa yang namanya cocok.
                </li>
              ) : (
                filtered.map((student) => {
                  const id = `class-member-${student.id}`;
                  const isMember = memberIds.has(student.id);
                  return (
                    <li key={student.id}>
                      <label
                        htmlFor={id}
                        className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-accent"
                      >
                        <Checkbox
                          id={id}
                          checked={selected.includes(student.id)}
                          onCheckedChange={(checked) =>
                            toggle(student.id, checked === true)
                          }
                        />
                        <Avatar className="size-8 shrink-0">
                          <AvatarImage src={student.photoUrl} alt="" />
                          <AvatarFallback className="text-xs">
                            {student.fullName.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {student.fullName}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {DISABILITY_LABELS[student.disabilityType] ?? student.disabilityType}
                            {isMember ? " - sudah di kelas ini" : ""}
                          </span>
                        </span>
                      </label>
                    </li>
                  );
                })
              )}
            </ul>

            <p className="text-xs text-muted-foreground">
              {selected.length} siswa akan menjadi anggota kelas ini.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button disabled={pending} onClick={simpan}>
              {pending ? (
                <Loader2 className="animate-spin" aria-hidden />
              ) : null}
              Simpan anggota
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}