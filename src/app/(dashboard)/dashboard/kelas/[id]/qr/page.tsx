import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getClass, getClassStudents, getTokens } from "@/lib/dummy/queries";
import { PageHeader } from "@/components/dashboard/page-header";
import { ToneBadge, formatTanggal } from "@/components/dashboard/feedback";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  QrBoard,
  type QrCardData,
} from "@/components/dashboard/kelas/qr-board";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Kartu QR Siswa",
  description: "Kartu QR akses belajar personal untuk setiap siswa dalam kelas.",
};

export default async function ClassQrPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getClass(id);
  if (!item) notFound();

  const [tokens, students] = await Promise.all([getTokens(id), getClassStudents(id)]);
  const studentById = new Map(students.map((student) => [student.id, student]));

  const data: QrCardData[] = tokens.flatMap((token) => {
    const student = studentById.get(token.studentId);
    if (!student) return [];
    return [
      {
        token: token.token,
        studentId: student.id,
        studentName: student.fullName,
        studentNickname: student.nickname,
        isActive: token.isActive,
        expiresAt: token.expiresAt,
        lastUsedAt: token.lastUsedAt,
        className: item.name,
        origin: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      },
    ];
  });

  const missing = students.filter((student) => !tokens.some((t) => t.studentId === student.id));

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href={`/dashboard/kelas/${item.id}`}>
          <ArrowLeft />
          Kembali ke kelas
        </Link>
      </Button>

      <PageHeader
        title={`Kartu QR ${item.name}`}
        description="Setiap siswa punya satu kartu QR untuk kelas ini. Cetak, tempel di meja, lalu siswa cukup memindai untuk masuk ke sesi belajar."
        actions={
          <ToneBadge
            label={`${data.filter((row) => row.isActive).length} dari ${data.length} token aktif`}
            tone="info"
          />
        }
      />

      <QrBoard data={data} />

      {missing.length > 0 ? (
        <Card className="border-warning/40 bg-warning/8">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {missing.map((student) => student.fullName).join(", ")} belum punya
              token QR di kelas ini. Buat token agar siswa bisa langsung belajar.
            </p>
            <Button asChild>
              <Link href={`/dashboard/kelas/${item.id}`}>Kelola siswa kelas</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Token berlaku sampai {formatTanggal(tokens[0]?.expiresAt ?? "2027-07-15")} sesuai
        masa aktif tahun ajaran.
      </p>
    </div>
  );
}