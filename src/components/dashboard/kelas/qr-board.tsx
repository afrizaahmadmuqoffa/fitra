"use client";

import * as React from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { generateTokenAction, toggleTokenAction } from "@/actions/tokens";
import { jalankanAction } from "@/lib/action-helpers";
import {
  Download,
  KeyRound,
  Link2,
  Printer,
  QrCode as QrIcon,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

export type QrCardData = {
  tokenId: string | null;
  studentId: string;
  studentName: string;
  studentNickname: string;
  isActive: boolean;
  expiresAt: string;
  lastUsedAt: string | null;
  classId: string;
  className: string;
  origin: string;
  /** Teks token hanya ada bila baru dibuat atau dirotasi pada sesi guru ini. */
  plaintext: string | null;
};

function formatDate(iso: string) {
  if (!iso) return "tidak ditentukan";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

/**
 * Tautan akses yang dipindai QR dan ditampilkan pada kartu.
 *
 * QR sengaja memuat tautan lengkap, bukan token telanjang, supaya kamera
 * langsung membuka layar belajar tanpa perlu menyusun alamat sendiri.
 */
function buildAccessUrl(origin: string, token: string): string {
  return `${origin.replace(/\/$/, "")}/belajar/${token}`;
}

/** Hook ini menerima teks apa pun yang akan dipindai: tautan, bukan token. */
function useQrDataUrl(payload: string | null) {
  const [result, setResult] = React.useState<{
    token: string | null;
    src: string | null;
  }>({ token: payload, src: null });

  React.useEffect(() => {
    if (!payload) return;
    let active = true;
    QRCode.toDataURL(payload, {
      width: 640,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#14332f", light: "#ffffff" },
    })
      .then((url) => {
        if (active) setResult({ token: payload, src: url });
      })
      .catch(() => {
        if (active) setResult({ token: payload, src: null });
      });
return () => {
      active = false;
    };
  }, [payload]);

  // Hasil milik tautan lain tidak pernah ditampilkan, sehingga kartu yang
  // tokennya baru dibuat/dirotasi langsung menampilkan QR-nya sendiri.
  return result.token === payload ? result.src : null;
}

type RevealState = {
  studentId: string;
  classId: string;
  studentName: string;
  token: string;
  origin: string;
};

function QrCard({
  data,
  onReveal,
}: {
  data: QrCardData;
  onReveal: (reveal: RevealState) => void;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [active, setActive] = React.useState(data.isActive);
  // QR memuat tautan lengkap agar kamera langsung membuka layar belajar.
  const accessUrl = data.plaintext ? buildAccessUrl(data.origin, data.plaintext) : null;
  const src = useQrDataUrl(accessUrl);
  const lastUsed = data.lastUsedAt ? formatDate(data.lastUsedAt) : null;

async function createToken() {
    setPending(true);
    try {
      const result = await jalankanAction(() =>
        generateTokenAction({
          classId: data.classId,
          studentId: data.studentId,
        }),
      );

      if (!result.ok || !result.token) {
        toast.error("Token gagal dibuat", { description: result.message });
        return;
      }
      onReveal({
        studentId: data.studentId,
        classId: data.classId,
        studentName: data.studentName,
        token: result.token,
        origin: data.origin,
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function toggleAccess() {
    const next = !active;
    setActive(next);
    const result = await jalankanAction(() =>
      toggleTokenAction({
        tokenId: data.tokenId ?? "",
        isActive: next,
      }),
    );
    if (!result.ok) {
      setActive(!next);
      toast.error("Token gagal diubah", { description: result.message });
      return;
    }
    toast.success(result.message);
    router.refresh();
  }

  async function copyLink() {
    if (!accessUrl) return;
    try {
      await navigator.clipboard.writeText(accessUrl);
      toast.success("Tautan akses disalin", { description: accessUrl });
    } catch {
      toast.error("Peramban tidak mengizinkan penyalinan otomatis");
    }
  }

  function download() {
    if (!src) {
      toast.error("Kode QR belum selesai dibuat");
      return;
    }
    const link = document.createElement("a");
    link.href = src;
    link.download = `fitra-qr-${data.studentId}.png`;
    link.click();
    toast.success(`QR ${data.studentName} diunduh`);
  }

  return (
    <Card className="print-page border-border/80">
      <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
        <div className="rounded-lg border bg-white p-3">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={`Kode QR akses belajar ${data.studentName}`}
              className="size-48"
              width={192}
              height={192}
            />
          ) : (
            <div className="grid size-48 place-items-center rounded-md bg-muted px-3 text-center text-xs text-muted-foreground">
              {data.tokenId
                ? "Tautan tersimpan sebagai hash. Buat ulang untuk melihat kode QR."
                : "Belum ada token untuk siswa ini."}
            </div>
          )}
        </div>

        <div>
          <p className="font-heading text-sm font-semibold">{data.studentName}</p>
          <p className="text-xs text-muted-foreground">
            {data.studentNickname} - {data.className}
          </p>
        </div>

        {accessUrl ? (
          <div className="w-full space-y-1">
            <p className="text-[0.6rem] uppercase tracking-wide text-muted-foreground">
              Pindai dengan kamera, atau buka tautan ini bila QR tidak terbaca
            </p>
            <p className="font-mono text-[0.6rem] leading-relaxed break-all text-foreground/80">
              {accessUrl}
            </p>
          </div>
        ) : (
          <Badge variant="secondary" className="text-[0.65rem]">
            Teks token tersimpan sebagai hash
          </Badge>
        )}

        <p className="text-[0.7rem] leading-relaxed text-muted-foreground">
          Berlaku sampai {formatDate(data.expiresAt)}
          <br />
          {lastUsed ? `Terakhir dipakai ${lastUsed}` : "Belum pernah dipakai siswa"}
        </p>

        <div className="no-print flex w-full flex-wrap items-center justify-between gap-2 border-t pt-3">
          {data.tokenId ? (
            <div className="flex items-center gap-2">
              <Switch
                id={`token-${data.studentId}`}
                size="sm"
                checked={active}
                onCheckedChange={toggleAccess}
                aria-label={`Aktifkan akses ${data.studentName}`}
              />
              <Label htmlFor={`token-${data.studentId}`} className="text-xs">
                {active ? "Aktif" : "Nonaktif"}
              </Label>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">Belum ada token</span>
          )}

          <div className="flex gap-1">
            {data.tokenId && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={copyLink}
                disabled={!accessUrl}
                aria-label={`Salin tautan akses ${data.studentName}`}
              >
                <Link2 />
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={download}
              disabled={!src}
            >
              <Download />
              PNG
            </Button>
            <Button size="sm" onClick={createToken} disabled={pending}>
              {data.tokenId ? <RefreshCw /> : <KeyRound />}
              {data.tokenId ? "Rotasi" : "Buat QR"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function QrBoard({ data }: { data: QrCardData[] }) {
  const [revealed, setRevealed] = React.useState<
    Record<string, { classId: string; token: string }>
  >(() =>
    Object.fromEntries(
      data
        .filter((item) => item.plaintext)
        .map((item) => [
          item.studentId,
          { classId: item.classId, token: item.plaintext as string },
        ]),
    ),
  );
  const [dialog, setDialog] = React.useState<RevealState | null>(null);
  const dialogUrl = dialog ? buildAccessUrl(dialog.origin, dialog.token) : null;
  const dialogSrc = useQrDataUrl(dialogUrl);

  const merged = data.map((item) => {
    const local = revealed[item.studentId];
    return {
      ...item,
      plaintext: local?.token ?? item.plaintext,
    };
  });

  const activeCount = merged.filter((item) => item.isActive).length;
  const printable = merged.filter((item) => item.plaintext);

  function onReveal(reveal: RevealState) {
    setRevealed((prev) => ({
      ...prev,
      [reveal.studentId]: {
        classId: reveal.classId,
        token: reveal.token,
      },
    }));
    setDialog(reveal);
  }

  function copyDialogLink() {
    if (!dialogUrl) return;
    void navigator.clipboard
      .writeText(dialogUrl)
      .then(() => toast.success("Tautan akses disalin", { description: dialogUrl }))
      .catch(() => toast.error("Peramban tidak mengizinkan penyalinan otomatis"));
  }

  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-3">
        <p className="text-sm text-muted-foreground">
          {activeCount} dari {merged.length} token aktif. Kode QR memuat tautan lengkap
          ke layar belajar, jadi siswa cukup memindai dengan kamera ponsel.
        </p>
        <Button
          onClick={() => window.print()}
          disabled={printable.length === 0}
        >
          <Printer />
          Cetak yang tampil
        </Button>
      </div>

      <ul className="grid gap-3 print:grid-cols-2 print:gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {merged.map((item) => (
          <li key={item.studentId}>
            <QrCard data={item} onReveal={onReveal} />
          </li>
        ))}
      </ul>

      <p className="no-print flex items-start gap-2 rounded-lg bg-info/8 p-4 text-xs leading-relaxed text-muted-foreground">
        <QrIcon className="mt-0.5 size-4 shrink-0 text-info" aria-hidden="true" />
        Tautan akses memakai kunci acak 32 karakter yang hanya disimpan sebagai hash
        SHA-256 di server. Teks tautannya muncul kembali setiap kali Anda membuat atau
        merotasi token, jadi cetak atau simpan sebelum meninggalkan halaman ini.
      </p>

      <Dialog open={Boolean(dialog)} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Kartu QR {dialog?.studentName}</DialogTitle>
            <DialogDescription>
              Cetak kartu ini sekarang. Tautan aksesnya tidak bisa ditampilkan lagi
              setelah Anda menutup dialog karena server hanya menyimpan hash token.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-3">
            <div className="rounded-lg border bg-white p-3">
              {dialogSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={dialogSrc}
                  alt={`Kode QR akses belajar ${dialog?.studentName ?? "siswa"}`}
                  className="size-48"
                  width={192}
                  height={192}
                />
              ) : (
                <div className="grid size-48 place-items-center rounded-md bg-muted text-xs text-muted-foreground">
                  Menyusun kode QR
                </div>
              )}
            </div>
            <div className="w-full space-y-1 text-center">
              <p className="text-[0.6rem] uppercase tracking-wide text-muted-foreground">
                Tautan yang dipindai
              </p>
              <p className="font-mono text-[0.65rem] leading-relaxed break-all">
                {dialogUrl}
              </p>
              <p className="text-xs text-muted-foreground">
                <ShieldCheck className="mr-1 inline size-3.5" aria-hidden="true" />
                Siswa cukup memindai; tanpa kamera, tautan di atas bisa diketik manual.
              </p>
            </div>
          </div>

          <DialogFooter className="sm:justify-center">
            <Button variant="outline" onClick={copyDialogLink}>
              <Link2 />
              Salin tautan
            </Button>
            <Button onClick={() => window.print()}>
              <Printer />
              Cetak kartu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}