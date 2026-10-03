import type { Metadata } from "next";
import { getDailyActivity, getProgressSummary } from "@/lib/dummy/queries";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  ProgresCharts,
  type DailyPoint,
  type SummaryRow,
} from "@/components/dashboard/progres/progres-charts";

export const metadata: Metadata = {
  title: "Pantauan Progres",
  description:
    "Grafik partisipasi, waktu belajar, dan ketepatan jawaban seluruh siswa Anda.",
};

export default async function ProgressPage() {
  const [daily, summary] = await Promise.all([getDailyActivity(), getProgressSummary()]);

  const rows: SummaryRow[] = summary.map((item) => ({
    studentId: item.student.id,
    fullName: item.student.fullName,
    nickname: item.student.nickname,
    disability: item.student.disabilityType,
    sessions: item.sessions,
    completed: item.completed,
    minutes: item.minutes,
    interactions: item.interactions,
    accuracy: item.accuracy,
    published: item.published,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pantau Progres"
        description="Bandingkan siapa yang aktif belajar, berapa lama waktu belajarnya, berapa soal yang berhasil dijawab, dan materi apa yang sudah dibaca."
      />

      <ProgresCharts daily={daily as DailyPoint[]} summary={rows} />
    </div>
  );
}