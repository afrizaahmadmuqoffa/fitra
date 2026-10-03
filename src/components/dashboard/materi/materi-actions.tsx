"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, RefreshCw, Send } from "lucide-react";
import {
  analyzeMaterialAgainAction,
  publishMaterialAction,
} from "@/actions/materials";

export function MateriActions({
  materialId,
  status,
  approvedCount,
  totalStudents,
}: {
  materialId: string;
  status: string;
  approvedCount: number;
  totalStudents: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<"proses" | "terbitkan" | null>(null);
  const [confirmPublish, setConfirmPublish] = React.useState(false);

  const canPublish = approvedCount > 0;
  const isPublished = status === "published";

  async function run(kind: "proses" | "terbitkan") {
    setBusy(kind);
    const result =
      kind === "proses"
        ? await analyzeMaterialAgainAction(materialId)
        : await publishMaterialAction(materialId);
    setBusy(null);

    if (!result.ok) {
      toast.error("Aksi gagal", { description: result.message });
      return;
    }

    if (kind === "proses") {
      toast.success(result.message, {
        description:
          "Struktur bab dianalisis ulang dari teks materi yang tersimpan di server.",
      });
    } else {
      toast.success(result.message, {
        description: `${approvedCount} versi adaptasi yang disetujui kini tampil di layar siswa.`,
      });
      setConfirmPublish(false);
    }
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        disabled={busy !== null || status === "pending_ai"}
        onClick={() => run("proses")}
      >
        {busy === "proses" ? (
          <Loader2 className="animate-spin" />
        ) : (
          <RefreshCw />
        )}
        {status === "pending_ai" ? "Sedang diproses" : "Proses ulang analisis"}
      </Button>

      {isPublished ? (
        <Button
          variant="outline"
          disabled={!canPublish}
          onClick={() => setConfirmPublish(true)}
        >
          <Send />
          Terbitkan revisi
        </Button>
      ) : (
        <Button disabled={!canPublish} onClick={() => setConfirmPublish(true)}>
          <Send />
          Terbitkan
        </Button>
      )}

      <Dialog open={confirmPublish} onOpenChange={setConfirmPublish}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Terbitkan materi ini?</DialogTitle>
            <DialogDescription>
              Hanya {approvedCount} dari {totalStudents} versi adaptasi yang sudah
              Anda setujui. Siswa dengan versi yang belum disetujui tetap melihat
              materi versi terakhir yang disetujui.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
            <li>Versi disetujui langsung tampil di layar belajar siswa.</li>
            <li>Versi berstatus draft tidak pernah terlihat siswa.</li>
            <li>Anda masih dapat menyunting dan menyetujui versi lain kapan saja.</li>
          </ul>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Batal</Button>
            </DialogClose>
            <Button disabled={busy !== null} onClick={() => run("terbitkan")}>
              {busy === "terbitkan" ? <Loader2 className="animate-spin" /> : <Send />}
              Ya, terbitkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}