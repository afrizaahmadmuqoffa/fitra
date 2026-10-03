"use client";

import * as React from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Link2, Printer, QrCode as QrIcon } from "lucide-react";

export type QrCardData = {
  token: string;
  studentId: string;
  studentName: string;
  studentNickname: string;
  isActive: boolean;
  expiresAt: string;
  lastUsedAt: string | null;
  className: string;
  origin: string;
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

function useQrDataUrl(token: string) {
  const [src, setSrc] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    QRCode.toDataURL(token, {
      width: 640,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#14332f", light: "#ffffff" },
    })
      .then((url) => {
        if (active) setSrc(url);
      })
      .catch(() => {
        if (active) setSrc(null);
      });
    return () => {
      active = false;
    };
  }, [token]);

  return src;
}

function QrCard({ data }: { data: QrCardData }) {
  const src = useQrDataUrl(data.token);
  const accessUrl = `${data.origin}/belajar/${data.token}`;
  const [active, setActive] = React.useState(data.isActive);
  const lastUsed = data.lastUsedAt ? formatDate(data.lastUsedAt) : null;

  async function download() {
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

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(accessUrl);
      toast.success("Tautan akses disalin", {
        description: accessUrl,
      });
    } catch {
      toast.error("Peramban tidak mengizinkan penyalinan otomatis");
    }
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
              className="size-40"
              width={160}
              height={160}
            />
          ) : (
            <div className="grid size-40 place-items-center rounded-md bg-muted text-xs text-muted-foreground">
              Menyusun kode QR
            </div>
          )}
        </div>

        <div>
          <p className="font-heading text-sm font-semibold">{data.studentName}</p>
          <p className="text-xs text-muted-foreground">
            {data.studentNickname} - {data.className}
          </p>
        </div>

        <Badge variant="outline" className="font-mono text-[0.65rem]">
          {data.token}
        </Badge>

        <p className="text-[0.7rem] leading-relaxed text-muted-foreground">
          Berlaku sampai {formatDate(data.expiresAt)}
          <br />
          {lastUsed ? `Terakhir dipakai ${lastUsed}` : "Belum pernah dipakai siswa"}
        </p>

        <div className="no-print flex w-full flex-wrap items-center justify-between gap-2 border-t pt-3">
          <div className="flex items-center gap-2">
            <Switch
              id={`token-${data.token}`}
              size="sm"
              checked={active}
              onCheckedChange={(value) => {
                setActive(value);
                toast.success(
                  value
                    ? `Akses ${data.studentName} diaktifkan`
                    : `Akses ${data.studentName} dinonaktifkan`,
                );
              }}
              aria-label={`Aktifkan akses ${data.studentName}`}
            />
            <Label htmlFor={`token-${data.token}`} className="text-xs">
              {active ? "Aktif" : "Nonaktif"}
            </Label>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon-sm" onClick={copyLink} aria-label="Salin tautan akses">
              <Link2 />
            </Button>
            <Button variant="outline" size="sm" onClick={download}>
              <Download />
              PNG
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function QrBoard({ data }: { data: QrCardData[] }) {
  const activeCount = data.filter((item) => item.isActive).length;

  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-3">
        <p className="text-sm text-muted-foreground">
{activeCount} dari {data.length} token aktif. Cetak seluruh kartu QR dan
        tempel di meja siswa atau di lanyard bawaan kelas.
        </p>
        <Button onClick={() => window.print()}>
          <Printer />
          Cetak semua
        </Button>
      </div>

      <ul className="grid gap-3 print:grid-cols-2 print:gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data.map((item) => (
          <li key={item.token}>
            <QrCard data={item} />
          </li>
        ))}
      </ul>

      <p className="no-print flex items-start gap-2 rounded-lg bg-info/8 p-4 text-xs leading-relaxed text-muted-foreground">
        <QrIcon className="mt-0.5 size-4 shrink-0 text-info" aria-hidden="true" />
        Token adalah kunci acak 32 karakter, bukan data pribadi siswa. Jika kartu QR
        hilang, nonaktifkan token tersebut lalu buat ulang agar tidak bisa diakses
        orang lain.
      </p>
    </div>
  );
}