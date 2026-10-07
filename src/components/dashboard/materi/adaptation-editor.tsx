"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  approveAdaptationAction,
  rejectAdaptationAction,
  saveAdaptationAction,
} from "@/actions/materials";
import {
  confirmVisualUploadAction,
  createVisualUploadTicketAction,
  generateVisualAction,
  regenerateAdaptationAction,
  removeVisualAction,
} from "@/actions/ai";
import { jalankanAction } from "@/lib/action-helpers";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToneBadge, formatTanggal, formatWaktu } from "@/components/dashboard/feedback";
import {
  PreferenceChips,
  InteractionModeList,
  SkillBarList,
} from "@/components/dashboard/siswa/profile-summary";
import { AUDIO_SPEED_LABELS, INTERACTION_LABELS, VISUAL_ASSET_STATUS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Check,
  Eye,
  ImagePlus,
  Loader2,
  Pencil,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  TriangleAlert,
  Volume2,
} from "lucide-react";
import type {
  AdaptedSection,
  Material,
  MaterialAdaptation,
  Student,
  StudentProfile,
  VisualAsset,
} from "@/lib/dummy/types";
import { ADAPTATION_STATUS } from "@/lib/constants";

type Kind = AdaptedSection["interactions"][number]["kind"];

const KIND_OPTIONS: { value: Kind; label: string }[] = [
  { value: "tap", label: "Pilih sentuh" },
  { value: "speech", label: "Ucapkan jawaban" },
  { value: "drag", label: "Susun gambar" },
  { value: "text", label: "Ketik jawaban" },
];

export function AdaptationEditor({
  material,
  adaptation,
  student,
  profile,
  initialAssets,
}: {
  material: Material;
  adaptation: MaterialAdaptation;
  student: Student;
  profile: StudentProfile | null;
  initialAssets: VisualAsset[];
}) {
  const router = useRouter();
  const materialId = material.id;
  const studentId = adaptation.studentId;
  const adaptationId = adaptation.id;
  const [sections, setSections] = React.useState<AdaptedSection[]>(
    adaptation.adaptedContent.sections,
  );
  const [status, setStatus] = React.useState(adaptation.status);
  const [assets, setAssets] = React.useState<VisualAsset[]>(initialAssets);
  const [edits, setEdits] = React.useState(adaptation.teacherEdits);
  const [approvedAt, setApprovedAt] = React.useState(adaptation.approvedAt);
  const [editing, setEditing] = React.useState(false);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState<number | null>(null);

  // `router.refresh()` memuat ulang `initialAssets` dari database, tapi
  // `useState` hanya memakai nilainya saat komponen pertama kali mount.
  // Tanpa penyesuaian ini, ilustrasi yang baru saja dibuat AI tetap tampil
  // sebagai "Sedang dibuat..." sampai guru memuat ulang halaman.
  //
  // Penyesuaian dilakukan saat render, bukan di dalam efek: `useState`
  // boleh disetel ulang saat render kalau nilainya bergantung pada props,
  // dan cara ini menghindari pemanggilan setState di dalam efek yang
  // dilarang oleh aturan lint.
  const tandaAssets = assets
    .map((item) => `${item.id}:${item.status}:${item.imageUrl ?? ""}`)
    .join("|");
  const [tandaServer, setTandaServer] = React.useState(tandaAssets);
  if (tandaServer !== tandaAssets) {
    setTandaServer(tandaAssets);
    setAssets(initialAssets);
  }

  function patchSection(index: number, patch: Partial<AdaptedSection>) {
    setSections((current) =>
      current.map((section, i) => (i === index ? { ...section, ...patch } : section)),
    );
  }

  function patchBody(index: number, bodyIndex: number, value: string) {
    setSections((current) =>
      current.map((section, i) =>
        i === index
          ? {
              ...section,
              body: section.body.map((line, j) => (j === bodyIndex ? value : line)),
            }
          : section,
      ),
    );
  }

  function addBodyLine(index: number) {
    setSections((current) =>
      current.map((section, i) =>
        i === index ? { ...section, body: [...section.body, ""] } : section,
      ),
    );
  }

  function removeBodyLine(index: number, bodyIndex: number) {
    setSections((current) =>
      current.map((section, i) =>
        i === index && section.body.length > 1
          ? { ...section, body: section.body.filter((_, j) => j !== bodyIndex) }
          : section,
      ),
    );
  }

  function assetFor(sectionIndex: number) {
    return assets.find((asset) => asset.sectionIndex === sectionIndex) ?? null;
  }

  async function regenerateVisual(sectionIndex: number) {
    const key = `regen-${sectionIndex}`;
    const sebelumnya = assetFor(sectionIndex)?.status;
    setAssets((current) =>
      current.map((asset) =>
        asset.sectionIndex === sectionIndex ? { ...asset, status: "generating" } : asset,
      ),
    );
    setBusy(key);
    try {
      const hasil = await jalankanAction(() =>
        generateVisualAction({ adaptationId, sectionIndex, skipIfReady: false }),
      );
      if (!hasil.ok) {
        // Rollback ke status sebelumnya
        setAssets((current) =>
          current.map((asset) =>
            asset.sectionIndex === sectionIndex
              ? { ...asset, status: sebelumnya ?? "failed" }
              : asset,
          ),
        );
        toast.error("Ilustrasi belum bisa dibuat", { description: hasil.message });
        return;
      }
      // Update status lokal dulu supaya UI tidak stuck di "generating"
      setAssets((current) =>
        current.map((asset) =>
          asset.sectionIndex === sectionIndex
            ? { ...asset, status: "ready" }
            : asset,
        ),
      );
      toast.success("Ilustrasi dibuat", {
        description:
          sebelumnya === "pending"
            ? `Gambar baru dipakai pada bagian ini untuk siswa ${student.nickname}.`
            : "Gambar baru menggantikan ilustrasi sebelumnya pada bagian ini.",
      });
      // refresh untuk sync imageUrl dari server
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function hapusVisual(sectionIndex: number) {
    const asset = assetFor(sectionIndex);
    if (!asset) return;

    setBusy(`hapus-${sectionIndex}`);
    try {
      const hasil = await jalankanAction(() => removeVisualAction({ assetId: asset.id }));
      if (!hasil.ok) {
        toast.error("Ilustrasi belum bisa dihapus", { description: hasil.message });
        return;
      }
      setSections((current) =>
        current.map((section, i) =>
          i === sectionIndex ? { ...section, media: [] } : section,
        ),
      );
      toast.success("Ilustrasi dihapus dari bagian ini");
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function replaceVisual(sectionIndex: number, file: File | undefined) {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ukuran gambar melebihi 10 MB", {
        description: "Kompres gambar dulu, lalu coba lagi.",
      });
      return;
    }

    setUploading(sectionIndex);
    try {
      // Tahap 1: minta tiket. Bucket, tipe berkas, dan batas ukuran
      // dicek di server supaya tidak bisa dilewati dari browser.
      const tiket = await jalankanAction(() =>
        createVisualUploadTicketAction({
          adaptationId,
          sectionIndex,
          fileName: file.name,
          sizeBytes: file.size,
        }),
      );

      if (!tiket.ok || !tiket.tiket || !tiket.contentType) {
        toast.error("Gagal mempersiapkan upload", { description: tiket.message });
        return;
      }
      const { path: storagePath, token } = tiket.tiket;
      const contentType = tiket.contentType;

      // Tahap 2: unggah langsung ke Supabase Storage. Berkas tidak
      // melewati Next.js sehingga batas 1 MB pada Server Action tidak
      // berlaku di sini.
      const supabase = createSupabaseBrowserClient();
      const { error: galatUnggah } = await supabase.storage
        .from("visual-assets")
        .uploadToSignedUrl(storagePath, token, file, {
          contentType,
          upsert: false,
        });

      if (galatUnggah) {
        toast.error("Gagal mengunggah gambar", { description: galatUnggah.message });
        return;
      }

      // Tahap 3: catat di database dan minta URL pratinjau.
      const hasil = await jalankanAction(() =>
        confirmVisualUploadAction({
          adaptationId,
          sectionIndex,
          storagePath,
        }),
      );

      if (!hasil.ok || !hasil.imageUrl) {
        toast.error("Gagal menyimpan ilustrasi", { description: hasil.message });
        return;
      }

      router.refresh();
      toast.success("Ilustrasi diunggah", {
        description: "Gambar tersimpan dan siap dipakai siswa.",
      });
    } finally {
      setUploading(null);
    }
  }

  function updateAltText(sectionIndex: number, altText: string) {
    setSections((current) =>
      current.map((section, i) =>
        i === sectionIndex
          ? { ...section, media: section.media.map((m) => ({ ...m, altText })) }
          : section,
      ),
    );
    setAssets((current) =>
      current.map((asset) => (asset.sectionIndex === sectionIndex ? { ...asset, altText } : asset)),
    );
  }

  async function regenerateSection(sectionIndex: number) {
    const key = `regen-section-${sectionIndex}`;
    setBusy(key);
    try {
      const hasil = await jalankanAction(() =>
        regenerateAdaptationAction({ materialId, studentId }),
      );
      if (!hasil.ok) {
        toast.error("Regenerasi gagal", { description: hasil.message });
        return;
      }
      toast.success("Versi baru dibuat", {
        description:
          "Versi ini menunggu review Anda. Versi sebelumnya tidak dihapus dan tetap tersimpan sebagai riwayat.",
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function approve() {
    setBusy("approve");
    try {
      const result = await jalankanAction(() =>
        approveAdaptationAction({ adaptationId }),
      );
      if (!result.ok) {
        toast.error("Persetujuan gagal", { description: result.message });
        return;
      }
      setStatus("approved");
      setApprovedAt(new Date().toISOString());
      toast.success("Adaptasi disetujui", {
        description:
          "Materi ini siap diterbitkan dari halaman materi. Siswa baru melihatnya setelah Anda menekan Terbitkan.",
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function reject() {
    setBusy("reject");
    try {
      const result = await jalankanAction(() =>
        rejectAdaptationAction({
          adaptationId,
          note: "Guru menolak versi adaptasi ini.",
        }),
      );
      if (!result.ok) {
        toast.error("Penolakan gagal", { description: result.message });
        return;
      }
      setStatus("rejected");
      setApprovedAt(null);
      toast.success("Adaptasi ditolak", {
        description: "Siswa tetap memakai versi adaptasi sebelumnya yang sudah disetujui.",
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function save() {
    setBusy("save");
    try {
      const result = await jalankanAction(() =>
        saveAdaptationAction({
          adaptationId,
          adaptedContent: {
            readingLevel: adaptation.adaptedContent.readingLevel,
            generatedFor: adaptation.studentId,
            sections,
          },
          note: `Suntingan guru disimpan untuk ${sections.length} bagian.`,
        }),
      );
      if (!result.ok) {
        toast.error("Suntingan gagal", { description: result.message });
        return;
      }
      setEdits((current) => [
        ...current,
        {
          at: new Date().toISOString(),
          note: `Suntingan guru disimpan untuk ${sections.length} bagian.`,
          sectionIndex: 0,
        },
      ]);
      setEditing(false);
      toast.success(result.message, {
        description: "Versi sebelumnya tetap ada di riwayat revisi.",
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  const meta = ADAPTATION_STATUS[status];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href={`/dashboard/materi/${material.id}`}>
            <ArrowLeft />
            Kembali ke materi
          </Link>
        </Button>

        <div className="no-print flex flex-wrap items-center gap-2">
          <ToneBadge label={`Status: ${meta.label}`} tone={meta.tone} />
          <Button variant="outline" onClick={() => setPreviewOpen(true)}>
            <Eye />
            Pratinjau tampilan siswa
          </Button>
          <Button
            variant="outline"
            onClick={() => setEditing((value) => !value)}
            aria-pressed={editing}
          >
            <Pencil />
            {editing ? "Berhenti menyunting" : "Sunting"}
          </Button>
          {editing ? (
            <Button onClick={save}>
              <Save />
              Simpan suntingan
            </Button>
          ) : null}
          {status !== "approved" ? (
            <Button disabled={sections.length === 0 || busy === "approve"} onClick={approve}>
              {busy === "approve" ? (
                <Loader2 className="animate-spin" aria-hidden />
              ) : (
                <Check aria-hidden />
              )}
              Setujui
            </Button>
          ) : (
            <Button variant="outline" disabled={busy === "reject"} onClick={reject}>
              {busy === "reject" ? (
                <Loader2 className="animate-spin" aria-hidden />
              ) : (
                <TriangleAlert aria-hidden />
              )}
              Cabut persetujuan
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-4">
          <Card className="border-border/80 bg-muted/40">
            <CardContent className="space-y-2 pt-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Target adaptasi
              </p>
              <h1 className="font-heading text-xl font-semibold">
                {material.title} untuk {student.nickname}
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Materi asli disederhanakan mengikuti profil belajar {student.fullName}.
                Semua hasil AI berstatus draft sampai Anda menyetujuinya.
              </p>
              <dl className="grid gap-2 pt-1 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Model AI</dt>
                  <dd className="font-mono text-xs">{adaptation.aiModel}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Tingkat baca</dt>
                  <dd>{adaptation.adaptedContent.readingLevel}</dd>
                </div>
                {approvedAt ? (
                  <div>
                    <dt className="text-xs text-muted-foreground">Disetujui</dt>
                    <dd>{formatTanggal(approvedAt)}</dd>
                  </div>
                ) : null}
              </dl>
              <p className="font-mono text-[0.65rem] leading-relaxed text-muted-foreground">
                {adaptation.aiPromptSnapshot}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/80">
            <CardContent className="space-y-3 pt-6">
              <p className="text-sm font-semibold">Materi asli</p>
              <p className="max-h-56 overflow-y-auto rounded-lg bg-muted/60 p-3 text-sm leading-relaxed text-muted-foreground">
                {material.sourceText}
              </p>
              {material.aiAnalysis ? (
                <ol className="space-y-2">
                  {material.aiAnalysis.structure.map((section, index) => (
                    <li key={section.title} className="flex gap-3 rounded-lg border p-3">
                      <span
                        className="grid size-6 shrink-0 place-items-center rounded-full bg-accent font-mono text-xs font-semibold text-accent-foreground"
                        aria-hidden="true"
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{section.title}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                          {section.summary}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : null}
            </CardContent>
          </Card>

          {profile ? (
            <Card className="border-border/80">
              <CardContent className="space-y-3 pt-6">
                <p className="text-sm font-semibold">Profil yang dipakai adaptasi ini</p>
                <SkillBarList
                  items={[
                    { label: "Membaca", value: profile.academicDetails.membaca },
                    { label: "Menulis", value: profile.academicDetails.menulis },
                    { label: "Berhitung", value: profile.academicDetails.berhitung },
                  ]}
                />
                <Separator />
                <p className="text-xs font-semibold text-muted-foreground">
                  Preferensi belajar
                </p>
                <PreferenceChips preferences={profile.learningPreferences} />
                <p className="text-xs font-semibold text-muted-foreground">
                  Bentuk interaksi
                </p>
                <InteractionModeList modes={profile.interactionModes} />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Audio {profile.uiTokens.audioEnabled ? "aktif" : "nonaktif"} dengan
                  kecepatan {AUDIO_SPEED_LABELS[profile.uiTokens.audioSpeed]} - ukuran
                  teks {profile.uiTokens.fontSize} - navigasi {profile.uiTokens.navStyle}.
                </p>
              </CardContent>
            </Card>
          ) : null}

          <Card className="border-border/80">
            <CardContent className="space-y-3 pt-6">
              <p className="text-sm font-semibold">Riwayat revisi</p>
              {edits.length === 0 ? (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Belum ada suntingan guru. Setiap regenerasi dan suntingan disimpan di
                  sini tanpa menghapus versi sebelumnya.
                </p>
              ) : (
                <ul className="space-y-2">
                  {edits.map((edit, i) => (
                    <li key={`${edit.at}-${i}`} className="rounded-lg border p-3">
                      <p className="text-sm">{edit.note}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatTanggal(edit.at)} - {formatWaktu(edit.at)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {sections.length === 0 ? (
            <Card className="border-dashed px-6 py-12 text-center">
              <Loader2 className="mx-auto size-6 animate-spin text-primary" aria-hidden="true" />
              <p className="mt-3 font-heading text-base font-semibold">
                Adaptasi sedang dibuat
              </p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                AI sedang menulis versi sederhana materi ini untuk {student.nickname}.
                Anda akan melihat hasilnya di halaman ini setelah proses selesai.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                disabled={busy !== null}
                onClick={() => regenerateSection(0)}
              >
                <RefreshCw />
                Buat versi baru sekarang
              </Button>
            </Card>
          ) : (
            <Tabs defaultValue="s-0" className="gap-4">
              <TabsList className="flex-wrap">
                {sections.map((section, index) => (
                  <TabsTrigger key={section.index} value={`s-${index}`}>
                    Bagian {index + 1}
                  </TabsTrigger>
                ))}
              </TabsList>

              {sections.map((section, sectionIndex) => {
                const asset = assetFor(sectionIndex);
                const assetMeta = asset ? VISUAL_ASSET_STATUS[asset.status] : null;
                const interaction = section.interactions[0];
                const altText = section.media[0]?.altText ?? "";

                return (
                  <TabsContent key={section.index} value={`s-${sectionIndex}`} className="space-y-4">
                    <Card className="border-border/80">
                      <CardContent className="space-y-4 pt-6">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <Label htmlFor={`title-${sectionIndex}`}>Judul bagian</Label>
                            <Input
                              id={`title-${sectionIndex}`}
                              className="mt-2"
                              value={section.title}
                              disabled={!editing}
                              onChange={(event) =>
                                patchSection(sectionIndex, { title: event.target.value })
                              }
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={editing || busy !== null}
                            onClick={() => regenerateSection(sectionIndex)}
                          >
                            {busy === `regen-section-${sectionIndex}` ? (
                              <Loader2 className="animate-spin" />
                            ) : (
                              <Sparkles />
                            )}
                            Buat ulang
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <Label>Isi materi</Label>
                          {section.body.map((line, bodyIndex) => (
                            <div key={bodyIndex} className="flex items-start gap-2">
                              <Textarea
                                rows={2}
                                value={line}
                                disabled={!editing}
                                aria-label={`Kalimat ${bodyIndex + 1} bagian ${sectionIndex + 1}`}
                                onChange={(event) =>
                                  patchBody(sectionIndex, bodyIndex, event.target.value)
                                }
                              />
                              {editing ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeBodyLine(sectionIndex, bodyIndex)}
                                  disabled={section.body.length <= 1}
                                  aria-label={`Hapus kalimat ${bodyIndex + 1}`}
                                >
                                  <Trash2 />
                                </Button>
                              ) : null}
                            </div>
                          ))}
                          {editing ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => addBodyLine(sectionIndex)}
                            >
                              Tambah kalimat
                            </Button>
                          ) : null}
                          <p className="text-xs leading-relaxed text-muted-foreground">
                            Satu kalimat pendek per baris membuat tampilan siswa lebih
                            mudah dipindai mata.
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-border/80">
                      <CardContent className="space-y-4 pt-6">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold">Ilustrasi</p>
                          {assetMeta ? (
                            <ToneBadge label={assetMeta.label} tone={assetMeta.tone} />
                          ) : (
                            <ToneBadge label="Tanpa ilustrasi" tone="muted" />
                          )}
                        </div>

{asset ? (
                          <>
                            <div
                              role="img"
                              aria-label={altText || "Pratinjau ilustrasi materi"}
                              style={
                                asset.imageUrl
                                  ? { backgroundImage: `url(${asset.imageUrl})` }
                                  : undefined
                              }
                              className={cn(
                                "grid h-48 place-items-center rounded-lg border bg-muted/60 bg-cover bg-center text-xs text-muted-foreground",
                                !asset.imageUrl && "border-dashed",
                              )}
                            >
                              {asset.imageUrl ? null : (
                                <span className="text-center px-4">
                                  {asset.status === "failed"
                                    ? "Ilustrasi gagal dibuat. Buat ulang atau unggah gambar sendiri."
                                    : asset.status === "rejected"
                                      ? "Ilustrasi ditolak. Klik tombol di bawah untuk buat ulang."
                                      : asset.status === "pending"
                                        ? "Belum ada gambar. Minta AI membuatkannya atau unggah gambar sendiri."
                                        : asset.status === "generating"
                                          ? "AI sedang membuat ilustrasi..."
                                          : asset.status === "ready"
                                            ? "Gambar tersimpan. Klik muat ulang untuk menampilkannya."
                                            : "Menunggu ilustrasi"}
                                </span>
                              )}
                            </div>

                            {/* Tombol refresh fallback — muncul saat status ready tapi imageUrl belum ada */}
                            {asset.status === "ready" && !asset.imageUrl ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.refresh()}
                                className="w-full"
                              >
                                <RefreshCw className="size-3.5" aria-hidden />
                                Muat ulang untuk menampilkan gambar
                              </Button>
                            ) : null}

                            <div>
                              <Label htmlFor={`alt-${sectionIndex}`}>
                                Teks alternatif (alt text)
                              </Label>
                              <Textarea
                                id={`alt-${sectionIndex}`}
                                rows={2}
                                className="mt-2"
                                value={altText}
                                disabled={!editing}
                                onChange={(event) =>
                                  updateAltText(sectionIndex, event.target.value)
                                }
                              />
                              <p className="mt-1 text-xs text-muted-foreground">
                                Alt text dibacakan layar pembaca suara untuk siswa
                                tunanetra.
                              </p>
                            </div>
                          </>
                        ) : (
                          <p className="rounded-lg bg-muted/60 p-4 text-sm leading-relaxed text-muted-foreground">
                            AI tidak menyarankan ilustrasi untuk bagian ini. Tambahkan
                            manual bila siswa lebih terbantu melihat gambarnya.
                          </p>
                        )}

                        {editing ? (
                          <div className="no-print flex flex-wrap items-center gap-2">
                            {asset ? (
                              <>
                                <Button
                                  variant={asset.status === "pending" ? "default" : "outline"}
                                  size="sm"
                                  disabled={
                                    busy !== null ||
                                    uploading !== null ||
                                    asset.status === "generating"
                                  }
                                  onClick={() => regenerateVisual(sectionIndex)}
                                >
                                  {busy === `regen-${sectionIndex}` ||
                                  asset.status === "generating" ? (
                                    <Loader2 className="animate-spin" aria-hidden />
                                  ) : asset.status === "pending" ? (
                                    <Sparkles aria-hidden />
                                  ) : (
                                    <RefreshCw aria-hidden />
                                  )}
                                  {busy === `regen-${sectionIndex}` || asset.status === "generating"
                                    ? "Sedang dibuat..."
                                    : asset.status === "pending"
                                      ? "Buat ilustrasi"
                                      : "Buat ulang ilustrasi"}
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={busy !== null || uploading !== null}
                                  onClick={() => hapusVisual(sectionIndex)}
                                >
                                  <Trash2 aria-hidden />
                                  Hapus
                                </Button>
                              </>
                            ) : null}

                            <Label
                              htmlFor={`upload-${sectionIndex}`}
                              className={cn(
                                "inline-flex h-7 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-[0.8rem] font-medium transition-colors hover:bg-muted focus-within:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                                (uploading !== null || busy !== null) &&
                                  "pointer-events-none opacity-50",
                              )}
                            >
                              {uploading === sectionIndex ? (
                                <Loader2 className="animate-spin" aria-hidden />
                              ) : (
                                <ImagePlus aria-hidden />
                              )}
                              {uploading === sectionIndex
                                ? "Mengunggah..."
                                : asset
                                  ? "Ganti ilustrasi"
                                  : "Upload ilustrasi"}
                            </Label>
                            <input
                              id={`upload-${sectionIndex}`}
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              className="sr-only"
                              disabled={uploading !== null || busy !== null}
                              onChange={(event) => {
                                replaceVisual(sectionIndex, event.target.files?.[0]);
                                event.target.value = "";
                              }}
                            />
                          </div>
                        ) : null}
                      </CardContent>
                    </Card>

                    <Card className="border-border/80">
                      <CardContent className="space-y-4 pt-6">
                        <div className="flex items-center gap-2">
                          <Volume2 className="size-4 text-primary" aria-hidden="true" />
                          <p className="text-sm font-semibold">Naskah audio</p>
                        </div>
                        <Textarea
                          rows={3}
                          value={section.audioScript}
                          disabled={!editing}
                          aria-label={`Naskah audio bagian ${sectionIndex + 1}`}
                          onChange={(event) =>
                            patchSection(sectionIndex, { audioScript: event.target.value })
                          }
                        />

                        {interaction ? (
                          <>
                            <Separator />
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label htmlFor={`prompt-${sectionIndex}`}>
                                  Pertanyaan interaksi
                                </Label>
                                <Input
                                  id={`prompt-${sectionIndex}`}
                                  value={interaction.prompt}
                                  disabled={!editing}
                                  onChange={(event) => {
                                    const next = [...section.interactions];
                                    next[0] = { ...interaction, prompt: event.target.value };
                                    patchSection(sectionIndex, { interactions: next });
                                  }}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`kind-${sectionIndex}`}>Jenis jawaban</Label>
                                <Select
                                  value={interaction.kind}
                                  disabled={!editing}
                                  onValueChange={(value) => {
                                    const next = [...section.interactions];
                                    next[0] = { ...interaction, kind: value as Kind };
                                    patchSection(sectionIndex, { interactions: next });
                                  }}
                                >
                                  <SelectTrigger id={`kind-${sectionIndex}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {KIND_OPTIONS.map((item) => (
                                      <SelectItem key={item.value} value={item.value}>
                                        {item.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>Pilihan jawaban</Label>
                              <ul className="space-y-2">
                                {interaction.options.map((option, optionIndex) => (
                                  <li key={option.id} className="flex items-center gap-2">
                                    <Input
                                      value={option.label}
                                      disabled={!editing}
                                      aria-label={`Pilihan ${optionIndex + 1}`}
                                      onChange={(event) => {
                                        const options = interaction.options.map((item, j) =>
                                          j === optionIndex
                                            ? { ...item, label: event.target.value }
                                            : item,
                                        );
                                        const next = [...section.interactions];
                                        next[0] = { ...interaction, options };
                                        patchSection(sectionIndex, { interactions: next });
                                      }}
                                    />
                                    <Button
                                      variant={option.correct ? "default" : "outline"}
                                      size="icon"
                                      disabled={!editing}
                                      aria-label={`Tandai jawaban benar: ${option.label}`}
                                      onClick={() => {
                                        const options = interaction.options.map((item) => ({
                                          ...item,
                                          correct: false,
                                        }));
                                        options[optionIndex] = { ...options[optionIndex], correct: true };
                                        const next = [...section.interactions];
                                        next[0] = {
                                          ...interaction,
                                          options,
                                          acceptedAnswers: [options[optionIndex].label.toLowerCase()],
                                        };
                                        patchSection(sectionIndex, { interactions: next });
                                      }}
                                    >
                                      <Check />
                                    </Button>
                                    {editing ? (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        disabled={interaction.options.length <= 2}
                                        aria-label={`Hapus pilihan ${optionIndex + 1}`}
                                        onClick={() => {
                                          const options = interaction.options.filter(
                                            (_, j) => j !== optionIndex,
                                          );
                                          const next = [...section.interactions];
                                          next[0] = {
                                            ...interaction,
                                            options,
                                            acceptedAnswers: options
                                              .filter((o) => o.correct)
                                              .map((o) => o.label.toLowerCase()),
                                          };
                                          patchSection(sectionIndex, { interactions: next });
                                        }}
                                      >
                                        <Trash2 />
                                      </Button>
                                    ) : null}
                                  </li>
                                ))}
                              </ul>
                              {editing ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const options = [
                                      ...interaction.options,
                                      {
                                        id: `opt-${sectionIndex}-${interaction.options.length}`,
                                        label: "Pilihan baru",
                                        correct: false,
                                      },
                                    ];
                                    const next = [...section.interactions];
                                    next[0] = { ...interaction, options };
                                    patchSection(sectionIndex, { interactions: next });
                                  }}
                                >
                                  Tambah pilihan
                                </Button>
                              ) : null}
                              <p className="text-xs leading-relaxed text-muted-foreground">
                                Bentuk interaksi mengikuti profil siswa
                                ({INTERACTION_LABELS[interaction.kind]}). Ubah bila siswa
                                lebih mudah menjawab dengan cara lain.
                              </p>
                            </div>
                          </>
                        ) : null}
                      </CardContent>
                    </Card>
                  </TabsContent>
                );
              })}
            </Tabs>
          )}

          <Card className="border-border/80">
            <CardContent className="pt-6">
              <p className="text-sm font-semibold">Catatan untuk guru dan siswa</p>
              <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-muted-foreground">
                <li>
                  Semua versi berstatus draft dan tidak terlihat siswa sebelum Anda
                  menyetujuinya.
                </li>
                <li>
                  Menerbitkan materi dilakukan di halaman materi, bukan di halaman
                  editor ini.
                </li>
                <li>
                  Bila profil siswa berubah, adaptasi ini ditandai perlu ditinjau ulang.
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="flex max-h-[90dvh] max-w-2xl flex-col gap-0 p-0">
          <DialogHeader className="shrink-0 border-b px-6 py-4">
            <DialogTitle>Pratinjau tampilan siswa</DialogTitle>
            <DialogDescription>
              Tampilan {student.nickname} dengan ukuran teks, kontras, dan tombol
              sesuai profil belajar. Interaksi tidak aktif di pratinjau ini.
            </DialogDescription>
          </DialogHeader>

          {/* Preview surface — pakai token UI dari profil */}
          <div
            className={cn(
              "student-surface flex-1 overflow-y-auto px-6 py-5",
              profile.uiTokens.contrastMode === "high" && "student-contrast",
            )}
            style={{
              "--student-scale":
                profile.uiTokens.fontSize === "low"
                  ? 1.15
                  : profile.uiTokens.fontSize === "high"
                    ? 1.3
                    : 1,
            } as React.CSSProperties}
          >
            <div className="space-y-4">
              {sections.map((section, sectionIndex) => {
                const asset = assetFor(sectionIndex);
                return (
                  <div key={section.index} className="rounded-xl border bg-card p-4 shadow-sm">
                    <p className="font-heading text-lg font-semibold leading-snug">
                      {section.title}
                    </p>

                    {/* Gambar ilustrasi */}
                    {asset?.imageUrl ? (
                      <img
                        src={asset.imageUrl}
                        alt={section.media[0]?.altText ?? ""}
                        className="mt-3 w-full rounded-lg object-cover"
                        style={{ maxHeight: "220px" }}
                      />
                    ) : section.media[0] ? (
                      <div className="mt-3 flex h-32 items-center justify-center rounded-lg border bg-muted/60 text-xs text-muted-foreground">
                        Ilustrasi belum dibuat
                      </div>
                    ) : null}

                    {/* Isi teks */}
                    <div className="mt-3 space-y-2">
                      {section.body.map((line, j) => (
                        <p key={j} className="leading-relaxed">
                          {line}
                        </p>
                      ))}
                    </div>

                    {/* Semua interaksi */}
                    {section.interactions.map((interaction, intIndex) => (
                      <div key={intIndex} className="mt-4 rounded-lg border border-primary/20 bg-accent/20 p-3">
                        <p className="font-medium leading-snug">{interaction.prompt}</p>
                        {interaction.options.length > 0 ? (
                          <div className="mt-2 grid gap-2 sm:grid-cols-2">
                            {interaction.options.map((option) => (
                              <div
                                key={option.id}
                                className="flex min-h-12 items-center justify-center rounded-xl border-2 border-primary/30 bg-background px-3 text-center font-medium transition-colors"
                              >
                                {option.label}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="mt-2 rounded-lg border bg-background px-3 py-2 text-sm text-muted-foreground">
                            Ketik jawaban...
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t px-6 py-3">
            <div className="flex w-full flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary">{sections.length} bagian</Badge>
              <Badge variant="secondary">{adaptation.adaptedContent.readingLevel}</Badge>
              <Badge variant="secondary">
                Teks {profile.uiTokens.fontSize === "low" ? "besar (1.15×)" : profile.uiTokens.fontSize === "high" ? "sangat besar (1.3×)" : "normal"}
              </Badge>
              {profile.uiTokens.contrastMode === "high" && (
                <Badge variant="secondary">Kontras tinggi</Badge>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}