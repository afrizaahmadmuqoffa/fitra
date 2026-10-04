"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToneBadge } from "@/components/dashboard/feedback";
import { DISABILITY_SHORT } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type DailyPoint = { date: string; minutes: number };
export type SummaryRow = {
  studentId: string;
  fullName: string;
  nickname: string;
  disability: string;
  sessions: number;
  completed: number;
  minutes: number;
  interactions: number;
  accuracy: number;
  published: number;
};

const RANGES = {
  "7": "7 hari terakhir",
  "30": "30 hari terakhir",
  "90": "90 hari terakhir",
} as const;

const CHART_TONES = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function ProgresCharts({
  daily,
  summary,
}: {
  daily: DailyPoint[];
  summary: SummaryRow[];
}) {
  const [range, setRange] = React.useState<keyof typeof RANGES>("30");

  const days = Number(range);
  const window = React.useMemo(() => {
    const withDay = daily.map((point) => ({ ...point, time: new Date(point.date).getTime() }));
    const latest = withDay.reduce((max, point) => Math.max(max, point.time), 0);
    const cutoff = latest - days * 24 * 60 * 60 * 1000;
    return withDay.filter((point) => point.time >= cutoff);
  }, [daily, days]);

  const participation = React.useMemo(
    () =>
      [...summary]
        .sort((a, b) => b.sessions - a.sessions)
        .map((row) => ({
          name: row.nickname,
          fullName: row.fullName,
          sesi: row.sessions,
          selesai: row.completed,
          ketepatan: row.accuracy,
          menit: row.minutes,
        })),
    [summary],
  );

  const totalMinutes = summary.reduce((a, row) => a + row.minutes, 0);
  const totalSessions = summary.reduce((a, row) => a + row.sessions, 0);
  const totalCompleted = summary.reduce((a, row) => a + row.completed, 0);
  const activeStudents = summary.filter((row) => row.sessions > 0).length;
  const accuracyAverage = summary.length
    ? Math.round(
        summary.reduce((a, row) => a + row.accuracy, 0) / summary.length,
      )
    : 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Data agregat diperbarui otomatis setiap selesai sesi. Filter bawaan 30 hari
          terakhir.
        </p>
        <Select value={range} onValueChange={(value) => setRange(value as keyof typeof RANGES)}>
          <SelectTrigger className="w-52" aria-label="Pilih rentang waktu">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(RANGES).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/80 p-4">
          <p className="text-sm text-muted-foreground">Waktu belajar</p>
          <p className="mt-1 font-heading text-2xl font-semibold tabular-nums">
            {totalMinutes} menit
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Dari {totalSessions} sesi yang tercatat
          </p>
        </Card>
        <Card className="border-border/80 p-4">
          <p className="text-sm text-muted-foreground">Sesi diselesaikan</p>
          <p className="mt-1 font-heading text-2xl font-semibold tabular-nums">
            {totalCompleted} dari {totalSessions}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Sesi berhenti di tengah tetap tercatat
          </p>
        </Card>
        <Card className="border-border/80 p-4">
          <p className="text-sm text-muted-foreground">Ketepatan rata-rata</p>
          <p className="mt-1 font-heading text-2xl font-semibold tabular-nums">
            {accuracyAverage}%
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Dari seluruh jawaban interaksi
          </p>
        </Card>
        <Card className="border-border/80 p-4">
          <p className="text-sm text-muted-foreground">Siswa aktif</p>
          <p className="mt-1 font-heading text-2xl font-semibold tabular-nums">
            {activeStudents} dari {summary.length}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Pernah membuka materi</p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/80 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Waktu belajar per hari</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Total menit belajar seluruh siswa dalam rentang {RANGES[range].toLowerCase()}.
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={window} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value: string) =>
                      new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" }).format(
                        new Date(value),
                      )
                    }
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                  />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} unit=" mnt" />
                  <Tooltip
                    formatter={(value) => [`${value} menit`, "Waktu belajar"]}
                    labelFormatter={(label) =>
                      new Intl.DateTimeFormat("id-ID", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      }).format(new Date(String(label)))
                    }
                    contentStyle={{ borderRadius: 12, fontSize: 12 }}
                  />
                  <Bar dataKey="minutes" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="text-base">Sebaran jenis hambatan</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Membantu Anda menempatkan siswa di kelompok adaptasi yang tepat.
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={Object.entries(
                      summary.reduce<Record<string, number>>((acc, row) => {
                        const key = DISABILITY_SHORT[row.disability] ?? row.disability;
                        acc[key] = (acc[key] ?? 0) + 1;
                        return acc;
                      }, {}),
                    ).map(([name, value]) => ({ name, value }))}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={48}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {summary.map((_, index) => (
                      <Cell key={index} fill={CHART_TONES[index % CHART_TONES.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value} siswa`, "Jumlah"]}
                    contentStyle={{ borderRadius: 12, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-1.5 text-xs text-muted-foreground">
              {Object.entries(
                summary.reduce<Record<string, number>>((acc, row) => {
                  const key = DISABILITY_SHORT[row.disability] ?? row.disability;
                  acc[key] = (acc[key] ?? 0) + 1;
                  return acc;
                }, {}),
              ).map(([name, value], index) => (
                <li key={name} className="flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className="size-2.5 rounded-sm"
                    style={{ background: CHART_TONES[index % CHART_TONES.length] }}
                  />
                  {name} ({value})
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle className="text-base">Partisipasi per siswa</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Klik kartu siswa untuk membuka riwayat sesi dan snapshot respons.
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={participation} layout="vertical" margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  width={72}
                />
                <Tooltip
                  formatter={(value, name) => [
                    `${value}`,
                    name === "ketepatan"
                      ? "Ketepatan (%)"
                      : name === "menit"
                        ? "Menit"
                        : name === "sesi"
                          ? "Sesi"
                          : "Selesai",
                  ]}
                  contentStyle={{ borderRadius: 12, fontSize: 12 }}
                />
                <Bar dataKey="sesi" fill="var(--chart-3)" radius={[0, 6, 6, 0]} />
                <Bar dataKey="selesai" fill="var(--chart-1)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <ul className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {summary.map((row) => (
              <li key={row.studentId}>
                <Link
                  href={`/dashboard/progres/${row.studentId}`}
                  className={cn(
                    "block rounded-lg border p-3 transition-colors hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  )}
                >
                  <p className="truncate text-sm font-medium">{row.fullName}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {row.sessions} sesi - {row.minutes} menit - {row.interactions} interaksi
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <ToneBadge
                      label={`Ketepatan ${row.accuracy}%`}
                      tone={row.accuracy >= 70 ? "success" : row.accuracy >= 40 ? "warning" : "destructive"}
                    />
                    {row.published > 0 ? (
                      <span className="text-xs text-muted-foreground">
                        {row.published} materi terbit
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Belum ada materi</span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span aria-hidden="true" className="size-2.5 rounded-sm bg-chart-3" />
              Sesi dimulai
            </span>
            <span className="flex items-center gap-1.5">
              <span aria-hidden="true" className="size-2.5 rounded-sm bg-chart-1" />
              Sesi diselesaikan
            </span>
            <Button variant="link" size="sm" asChild className="h-auto p-0">
              <Link href="/#panduan">Cara membaca data progres</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}