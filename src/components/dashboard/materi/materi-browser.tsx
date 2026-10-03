"use client";

import * as React from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, ToneBadge, formatTanggal } from "@/components/dashboard/feedback";
import { MATERIAL_STATUS } from "@/lib/constants";
import { CircleAlert, Search } from "lucide-react";

export type MateriRow = {
  id: string;
  title: string;
  subject: string;
  className: string;
  sourceType: string;
  sourceFileName: string;
  status: string;
  createdAt: string;
  sections: number;
  adaptations: number;
  approved: number;
  readingLevel: string | null;
};

const SOURCE_LABEL: Record<string, string> = {
  pdf: "PDF",
  docx: "DOCX",
  text: "Teks",
};

const STATUS_ORDER = ["draft", "pending_ai", "ai_ready", "published"] as const;

const STATUS_STEP: Record<string, number> = {
  draft: 15,
  pending_ai: 45,
  ai_ready: 75,
  published: 100,
};

export function MateriBrowser({ rows }: { rows: MateriRow[] }) {
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<string>("semua");

  const counts = React.useMemo(() => {
    const map: Record<string, number> = { semua: rows.length };
    for (const key of STATUS_ORDER) map[key] = 0;
    for (const row of rows) map[row.status] = (map[row.status] ?? 0) + 1;
    return map;
  }, [rows]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (status !== "semua" && row.status !== status) return false;
      if (!q) return true;
      return (
        row.title.toLowerCase().includes(q) ||
        row.subject.toLowerCase().includes(q) ||
        row.className.toLowerCase().includes(q)
      );
    });
  }, [rows, query, status]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative lg:w-80">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari judul atau mata pelajaran"
            aria-label="Cari materi"
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Saring status materi">
          <button
            type="button"
            onClick={() => setStatus("semua")}
            aria-pressed={status === "semua"}
            className={
              "rounded-full border px-3 py-1 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring " +
              (status === "semua"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-primary/50")
            }
          >
            Semua ({counts.semua})
          </button>
          {STATUS_ORDER.map((key) => {
            const meta = MATERIAL_STATUS[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => setStatus(key)}
                aria-pressed={status === key}
                className={
                  "rounded-full border px-3 py-1 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring " +
                  (status === key
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:border-primary/50")
                }
              >
                {meta.label} ({counts[key] ?? 0})
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-sm text-muted-foreground" role="status">
        Menampilkan {filtered.length} dari {rows.length} materi
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          icon={CircleAlert}
          title="Tidak ada materi yang cocok"
          description="Ubah kata kunci atau pilih status lain untuk melihat materi Anda yang lain."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setQuery("");
                setStatus("semua");
              }}
            >
              Bersihkan filter
            </Button>
          }
        />
      ) : (
        <Card className="border-border/80">
          <ScrollArea className="w-full">
            <Table className="min-w-[52rem]">
              <TableHeader>
                <TableRow>
                  <TableHead>Materi</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Sumber</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="min-w-40">Adaptasi</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => {
                  const meta = MATERIAL_STATUS[row.status];
                  return (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Link
                          href={`/dashboard/materi/${row.id}`}
                          className="font-medium hover:text-primary hover:underline"
                        >
                          {row.title}
                        </Link>
                        <span className="block text-xs text-muted-foreground">
                          {row.subject} - {row.sections} bagian - dibuat{" "}
                          {formatTanggal(row.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {row.className ? (
                          <Badge variant="secondary">{row.className}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Tanpa kelas</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{SOURCE_LABEL[row.sourceType] ?? row.sourceType}</span>
                        <span className="block max-w-40 truncate text-xs text-muted-foreground">
                          {row.sourceFileName}
                        </span>
                      </TableCell>
                      <TableCell>
                        <ToneBadge label={meta.label} tone={meta.tone} />
                      </TableCell>
                      <TableCell>
                        <Progress
                          value={STATUS_STEP[row.status] ?? 0}
                          className="max-w-36"
                          indicatorClassName={meta.tone === "success" ? "bg-success" : "bg-primary"}
                          aria-label={`Tahap proses ${row.title}`}
                        />
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {row.approved} disetujui dari {row.adaptations} siswa
                          {row.readingLevel ? ` - ${row.readingLevel}` : ""}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/materi/${row.id}`}>Kelola</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>
      )}
    </div>
  );
}