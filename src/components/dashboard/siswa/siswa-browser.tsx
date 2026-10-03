"use client";

import * as React from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState, DisabilityBadge, ToneBadge } from "@/components/dashboard/feedback";
import { DISABILITY_LABELS, LEVEL_LABELS } from "@/lib/constants";
import {
  ArrowUpRight,
  CircleAlert,
  LayoutGrid,
  Rows3,
  Search,
} from "lucide-react";
import type { ClassRoom, Student, StudentProfile } from "@/lib/dummy/types";

export type SiswaRow = {
  student: Student;
  classes: Pick<ClassRoom, "id" | "name" | "grade">[];
  profile: StudentProfile | null;
  publishedMaterials: number;
  sessions: number;
  minutes: number;
  accuracy: number;
  lastSessionAt: string | null;
};

function initialsOf(name: string) {
  return name
    .split(" ")
    .filter((w) => /^[A-Z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
}

function relativeDay(iso: string | null): string {
  if (!iso) return "Belum pernah belajar";
  const day = new Date(iso);
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(day);
}

export function SiswaBrowser({ rows }: { rows: SiswaRow[] }) {
  const [query, setQuery] = React.useState("");
  const [disability, setDisability] = React.useState("semua");
  const [view, setView] = React.useState<"kartu" | "tabel">("kartu");

  const disabilityOptions = React.useMemo(() => {
    const present = Array.from(new Set(rows.map((r) => r.student.disabilityType)));
    return present
      .map((key) => ({ key, label: DISABILITY_LABELS[key] ?? key }))
      .sort((a, b) => a.label.localeCompare(b.label, "id"));
  }, [rows]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (disability !== "semua" && row.student.disabilityType !== disability) {
        return false;
      }
      if (!q) return true;
      return (
        row.student.fullName.toLowerCase().includes(q) ||
        row.student.nickname.toLowerCase().includes(q) ||
        row.classes.some((c) => c.name.toLowerCase().includes(q))
      );
    });
  }, [rows, query, disability]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama siswa atau kelas"
            aria-label="Cari siswa"
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={disability} onValueChange={setDisability}>
            <SelectTrigger
              className="w-full lg:w-56"
              aria-label="Saring jenis hambatan"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua jenis hambatan</SelectItem>
              {disabilityOptions.map((option) => (
                <SelectItem key={option.key} value={option.key}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(value) => {
              if (value) setView(value as "kartu" | "tabel");
            }}
            variant="outline"
            aria-label="Pilih tampilan daftar"
          >
            <ToggleGroupItem value="kartu" aria-label="Tampilan kartu">
              <LayoutGrid />
            </ToggleGroupItem>
            <ToggleGroupItem value="tabel" aria-label="Tampilan tabel">
              <Rows3 />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <p className="text-sm text-muted-foreground" role="status">
        Menampilkan {filtered.length} dari {rows.length} siswa
        {disability !== "semua" ? ` dengan jenis hambatan ${DISABILITY_LABELS[disability]}` : ""}
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          icon={CircleAlert}
          title="Tidak ada siswa yang cocok"
          description="Coba kata kunci lain atau pilih Semua jenis hambatan untuk melihat seluruh daftar siswa."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setQuery("");
                setDisability("semua");
              }}
            >
              Bersihkan filter
            </Button>
          }
        />
      ) : view === "kartu" ? (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((row) => (
            <li key={row.student.id}>
              <Card className="h-full border-border/80 transition-colors hover:border-primary/40">
                <CardContent className="flex h-full flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="size-12 shrink-0">
                      <AvatarImage src={row.student.photoUrl} alt="" />
                      <AvatarFallback>{initialsOf(row.student.fullName)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-heading text-base font-semibold">
                        {row.student.fullName}
                      </p>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">
                        {row.student.age} tahun - {row.student.gender === "L" ? "Laki-laki" : "Perempuan"}
                      </p>
                      <DisabilityBadge
                        className="mt-2"
                        label={DISABILITY_LABELS[row.student.disabilityType] ?? row.student.disabilityType}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {row.classes.length ? (
                      row.classes.map((c) => (
                        <Badge key={c.id} variant="secondary">
                          {c.name}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline">Belum ada kelas</Badge>
                    )}
                  </div>

                  <dl className="grid grid-cols-3 gap-2 border-t pt-3 text-center">
                    <div>
                      <dt className="text-xs text-muted-foreground">Sesi</dt>
                      <dd className="font-heading text-lg font-semibold tabular-nums">
                        {row.sessions}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Menit</dt>
                      <dd className="font-heading text-lg font-semibold tabular-nums">
                        {row.minutes}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Benar</dt>
                      <dd className="font-heading text-lg font-semibold tabular-nums">
                        {row.accuracy}%
                      </dd>
                    </div>
                  </dl>

                  <Progress
                    value={row.accuracy}
                    aria-label={`Ketepatan jawaban ${row.student.fullName}`}
                  />

                  <div className="mt-auto space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Belajar terakhir: {relativeDay(row.lastSessionAt)}
                    </p>
                    {row.profile ? (
                      <ToneBadge
                        label={LEVEL_LABELS[row.profile.academicLevel]}
                        tone={row.profile.academicLevel === "low" ? "warning" : "info"}
                      />
                    ) : (
                      <ToneBadge label="Profil belum diisi" tone="destructive" />
                    )}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild className="flex-1">
                        <Link href={`/dashboard/siswa/${row.student.id}`}>Lihat detail</Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild className="flex-1">
                        <Link href={`/dashboard/progres/${row.student.id}`}>Progres</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <Card className="border-border/80">
          <ScrollArea className="w-full">
            <Table className="min-w-[46rem]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <span className="sr-only">Foto</span>
                  </TableHead>
                  <TableHead>Nama siswa</TableHead>
                  <TableHead>Jenis hambatan</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead className="text-right">Sesi</TableHead>
                  <TableHead className="text-right">Menit</TableHead>
                  <TableHead className="text-right">Benar</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow key={row.student.id}>
                    <TableCell>
                      <Avatar className="size-8">
                        <AvatarImage src={row.student.photoUrl} alt="" />
                        <AvatarFallback>{initialsOf(row.student.fullName)}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{row.student.fullName}</span>
                      <span className="block text-xs text-muted-foreground">
                        {row.student.age} tahun - {row.student.gender}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DisabilityBadge
                        label={DISABILITY_LABELS[row.student.disabilityType] ?? row.student.disabilityType}
                      />
                    </TableCell>
                    <TableCell>
                      <span className="flex flex-wrap gap-1">
                        {row.classes.length ? (
                          row.classes.map((c) => (
                            <Badge key={c.id} variant="secondary">
                              {c.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">Belum ada kelas</span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{row.sessions}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.minutes}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.accuracy}%</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" asChild>
                          <Link
                            href={`/dashboard/siswa/${row.student.id}`}
                            aria-label={`Lihat detail ${row.student.fullName}`}
                          >
                            <ArrowUpRight />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>
      )}
    </div>
  );
}