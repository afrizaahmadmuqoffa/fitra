import type { Metadata } from "next";
import Link from "next/link";
import { getClassesWithMeta } from "@/db/queries";
import { PageHeader } from "@/components/dashboard/page-header";
import { ToneBadge, formatTanggal } from "@/components/dashboard/feedback";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KelasToolbar } from "@/components/dashboard/kelas/kelas-toolbar";
import { ArrowRight, BookOpen, GraduationCap, QrCode, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Daftar Kelas",
  description:
    "Kelas yang Anda ampu beserta jumlah siswa, materi aktif, dan token QR aktif.",
};

export default async function ClassesPage() {
  const classes = await getClassesWithMeta();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kelas"
        description="Setiap kelas punya materi dan token QR sendiri. Token dibuat acak dan tidak memuat identitas siswa."
        actions={<KelasToolbar grade="Kelas IV" />}
      />

      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {classes.map((item) => (
          <li key={item.id}>
            <Card className="flex h-full flex-col border-border/80 transition-colors hover:border-primary/40">
              <CardContent className="flex h-full flex-col gap-4 pt-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-heading text-lg font-semibold">
                      <GraduationCap className="size-5 text-primary" aria-hidden="true" />
                      {item.name}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.subject}</p>
                  </div>
                  <ToneBadge
                    label={item.grade}
                    tone="muted"
                  />
                </div>

                <p className="text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>

                <dl className="grid grid-cols-3 gap-2 border-y py-3 text-center">
                  <div>
                    <dt className="text-xs text-muted-foreground">Siswa</dt>
                    <dd className="mt-0.5 flex items-center justify-center gap-1 font-heading text-lg font-semibold tabular-nums">
                      <Users className="size-3.5 text-muted-foreground" aria-hidden="true" />
                      {item.studentCount}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Materi</dt>
                    <dd className="mt-0.5 flex items-center justify-center gap-1 font-heading text-lg font-semibold tabular-nums">
                      <BookOpen className="size-3.5 text-muted-foreground" aria-hidden="true" />
                      {item.materialCount}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">QR aktif</dt>
                    <dd className="mt-0.5 flex items-center justify-center gap-1 font-heading text-lg font-semibold tabular-nums">
                      <QrCode className="size-3.5 text-muted-foreground" aria-hidden="true" />
                      {item.activeTokens}
                    </dd>
                  </div>
                </dl>

                <p className="text-xs text-muted-foreground">
                  Ruang {item.room} - dibuat {formatTanggal(item.createdAt)}
                </p>

                <div className="mt-auto flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link href={`/dashboard/kelas/${item.id}`}>
                      Buka kelas
                      <ArrowRight />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild className="flex-1">
                    <Link href={`/dashboard/kelas/${item.id}/qr`}>
                      <QrCode />
                      QR siswa
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}