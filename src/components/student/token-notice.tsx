import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatTanggal } from "@/components/dashboard/feedback";
import { CircleAlert, CircleCheck, Clock, QrCode } from "lucide-react";

type Status = "tidak-ditemukan" | "nonaktif" | "kedaluwarsa" | "tidak-ditemuka";

const COPY: Record<
  Status,
  { title: string; body: string; icon: typeof CircleAlert }
> = {
  "tidak-ditemukan": {
    title: "Kode QR tidak dikenali",
    body: "Sepertinya kode ini bukan milik kelasmu. Minta guru memindai ulang kartu QR yang benar milikmu.",
    icon: QrCode,
  },
  nonaktif: {
    title: "Akses belajar sedang dinonaktifkan",
    body: "Guru menonaktifkan aksesmu sementara. Bicara dengan guru, lalu minta kartu QR baru.",
    icon: CircleAlert,
  },
  kedaluwarsa: {
    title: "Kartu QR sudah tidak berlaku",
    body: "Masa berlaku kartu QR ini sudah habis. Minta kartu QR baru kepada guru.",
    icon: Clock,
  },
  "tidak-ditemuka": {
    title: "Data siswa tidak ditemukan",
    body: "Guru perlu memeriksa kembali data kelas dan membuatkan kartu QR yang baru.",
    icon: CircleAlert,
  },
};

export function TokenNotice({
  status,
  studentName,
  expiresAt,
  samples = [],
}: {
  status: Status;
  studentName?: string;
  expiresAt?: string;
  samples?: string[];
}) {
  const copy = COPY[status];

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 px-3 py-6">
      <Card className="border-2 border-primary/30">
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-accent text-accent-foreground">
            <copy.icon className="size-7" aria-hidden="true" />
          </span>
          <h1 className="font-heading text-2xl font-bold">{copy.title}</h1>
          <p className="max-w-md text-base leading-relaxed text-muted-foreground">
            {studentName ? `${studentName}, ` : ""}
            {copy.body}
          </p>
          {expiresAt ? (
            <p className="text-sm text-muted-foreground">
              Berlaku sampai {formatTanggal(expiresAt)}
            </p>
          ) : null}
          <Button variant="outline" asChild className="mt-2">
            <Link href="/">Kembali ke halaman Fitra</Link>
          </Button>
        </CardContent>
      </Card>

      {samples.length > 0 ? (
        <Card className="no-print border-dashed bg-muted/40">
          <CardContent className="space-y-3 py-6">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <CircleCheck className="size-4 text-success" aria-hidden="true" />
              Coba dengan token contoh
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Token di bawah milik kelas IV-B dan sedang aktif. Pilih salah satu untuk
              membuka layar sapaan siswa.
            </p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {samples.slice(0, 4).map((token) => (
                <li key={token}>
                  <Link
                    href={`/belajar/${token}`}
                    className="block truncate rounded-lg border bg-background px-3 py-2 font-mono text-xs transition-colors hover:border-primary/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    {token}
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}