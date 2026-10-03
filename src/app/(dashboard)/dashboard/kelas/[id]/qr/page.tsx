import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getClass, getClassStudents, getTokens } from "@/db/queries";
import { readRevealedTokens } from "@/lib/token-reveal";
import { PageHeader } from "@/components/dashboard/page-header";
import { ToneBadge } from "@/components/dashboard/feedback";
import { Button } from "@/components/ui/button";
import { QrBoard, type QrCardData } from "@/components/dashboard/kelas/qr-board";
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

  const [tokens, students, revealed] = await Promise.all([
    getTokens(id),
    getClassStudents(id),
    readRevealedTokens(id),
  ]);
  const tokenByStudent = new Map(tokens.map((token) => [token.studentId, token]));
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const data: QrCardData[] = students.map((student) => {
    const token = tokenByStudent.get(student.id);
    return {
      tokenId: token?.id ?? null,
      studentId: student.id,
      studentName: student.fullName,
      studentNickname: student.nickname,
      isActive: token?.isActive ?? false,
      expiresAt: token?.expiresAt ?? "",
      lastUsedAt: token?.lastUsedAt ?? null,
      classId: item.id,
      className: item.name,
      origin,
      plaintext: revealed[student.id] ?? null,
    };
  });

  const withoutToken = students.filter((student) => !tokenByStudent.has(student.id));
  const activeCount = data.filter((row) => row.isActive).length;

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
            label={`${activeCount} dari ${data.length} token aktif`}
            tone="info"
          />
        }
      />

      <QrBoard data={data} />

      {withoutToken.length > 0 ? (
        <p className="text-sm text-muted-foreground">
          {withoutToken.map((student) => student.fullName).join(", ")} belum punya token
          QR di kelas ini. Tekan tombol Buat QR pada kartunya agar siswa bisa langsung
          belajar.
        </p>
      ) : null}
    </div>
  );
}