"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Accessibility, Check, Type, Volume2, X } from "lucide-react";
import { AUDIO_SPEED_LABELS, CONTRAST_LABELS, LEVEL_LABELS } from "@/lib/constants";
import type { StudentProfile } from "@/db/types";

type FontSize = StudentProfile["uiTokens"]["fontSize"];
type ContrastMode = StudentProfile["uiTokens"]["contrastMode"];
type AudioSpeed = StudentProfile["uiTokens"]["audioSpeed"];

const STORAGE_KEY = "fitra-student-overrides";

export interface StudentOverrides {
  fontSize?: FontSize;
  contrastMode?: ContrastMode;
  audioEnabled?: boolean;
  audioSpeed?: AudioSpeed;
}

export function StudentControls({ defaults, onChange }: { defaults: StudentProfile["uiTokens"]; onChange: (overrides: StudentOverrides) => void }) {
  const [open, setOpen] = React.useState(false);
  const [overrides, setOverrides] = React.useState<StudentOverrides>(() => {
    if (typeof window === "undefined") return {};
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as StudentOverrides) : {};
    } catch {
      return {};
    }
  });

  React.useEffect(() => {
    onChange(overrides);
  }, [onChange, overrides]);

  const fontSize = overrides.fontSize ?? defaults.fontSize;
  const contrastMode = overrides.contrastMode ?? defaults.contrastMode;
  const audioEnabled = overrides.audioEnabled ?? defaults.audioEnabled;
  const audioSpeed = overrides.audioSpeed ?? defaults.audioSpeed;

  const updateOverride = <K extends keyof StudentOverrides>(key: K, value: StudentOverrides[K]) => {
    const next = { ...overrides, [key]: value };
    setOverrides(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  const resetOverrides = () => {
    setOverrides({});
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  const hasOverrides = Object.keys(overrides).length > 0;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 left-4 z-50 size-14 rounded-[1.25rem] border-white/90 bg-white/90 text-[#33635a] shadow-[0_12px_35px_rgba(23,53,47,.12)] backdrop-blur-xl transition-transform duration-160 ease-out hover:-translate-y-0.5 hover:bg-white active:scale-[0.97] md:bottom-6 md:left-6"
          aria-label="Buka pengaturan belajar"
        >
          <Accessibility className="size-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-[2rem] border-[#17352f]/8 bg-[#fdfcf8] px-4 pb-8 pt-6 sm:px-6">
        <div className="mx-auto w-full max-w-2xl">
          <SheetTitle className="font-heading text-2xl font-black text-[#17352f]">Bikin Fitra pas denganmu</SheetTitle>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#17352f]/55">Atur tulisan, kontras, dan suara. Perubahannya hanya berlaku di perangkat ini.</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <SettingBox icon={<Type className="size-5" />} title="Ukuran teks" tone="mint">
              <Label htmlFor="fontSize" className="sr-only">Ukuran teks</Label>
              <Select value={fontSize} onValueChange={(v) => updateOverride("fontSize", v as FontSize)}>
                <SelectTrigger id="fontSize" className="min-h-12 rounded-2xl border-[#17352f]/10 bg-white font-bold"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{LEVEL_LABELS.low}</SelectItem>
                  <SelectItem value="medium">{LEVEL_LABELS.medium}</SelectItem>
                  <SelectItem value="high">{LEVEL_LABELS.high}</SelectItem>
                </SelectContent>
              </Select>
            </SettingBox>

            <SettingBox icon={<span className="font-heading text-lg font-black">Aa</span>} title="Kontras" tone="sky">
              <Label htmlFor="contrastMode" className="sr-only">Kontras warna</Label>
              <Select value={contrastMode} onValueChange={(v) => updateOverride("contrastMode", v as ContrastMode)}>
                <SelectTrigger id="contrastMode" className="min-h-12 rounded-2xl border-[#17352f]/10 bg-white font-bold"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">{CONTRAST_LABELS.normal}</SelectItem>
                  <SelectItem value="high">{CONTRAST_LABELS.high}</SelectItem>
                </SelectContent>
              </Select>
            </SettingBox>
          </div>

          <div className="mt-3 rounded-[1.5rem] border border-[#17352f]/8 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-2xl bg-[#ffe9a6] text-[#735d18]"><Volume2 className="size-5" /></span>
                <div>
                  <Label htmlFor="audioEnabled" className="font-heading text-base font-black">Bacakan materi</Label>
                  <p className="text-xs text-[#17352f]/50">Dengarkan teks dengan suara.</p>
                </div>
              </div>
              <Switch id="audioEnabled" checked={audioEnabled} onCheckedChange={(v) => updateOverride("audioEnabled", v)} />
            </div>
            {audioEnabled ? (
              <div className="mt-4">
                <Label htmlFor="audioSpeed" className="text-sm font-bold">Kecepatan suara</Label>
                <Select value={audioSpeed} onValueChange={(v) => updateOverride("audioSpeed", v as AudioSpeed)}>
                  <SelectTrigger id="audioSpeed" className="mt-2 min-h-12 rounded-2xl border-[#17352f]/10 bg-[#f8f8f2] font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slow">{AUDIO_SPEED_LABELS.slow}</SelectItem>
                    <SelectItem value="normal">{AUDIO_SPEED_LABELS.normal}</SelectItem>
                    <SelectItem value="fast">{AUDIO_SPEED_LABELS.fast}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>

          {hasOverrides ? (
            <Button variant="ghost" className="mt-4 min-h-12 rounded-2xl font-bold text-[#8a5444] hover:bg-[#f7e9e1] hover:text-[#8a5444]" onClick={resetOverrides}>
              <X className="size-4" /> Kembalikan pengaturan awal
            </Button>
          ) : (
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#33635a]/60"><Check className="size-4" /> Pengaturan mengikuti profil belajarmu.</div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SettingBox({ icon, title, tone, children }: { icon: React.ReactNode; title: string; tone: "mint" | "sky"; children: React.ReactNode }) {
  return (
    <div className={`rounded-[1.5rem] border p-4 ${tone === "mint" ? "border-[#bfead4] bg-[#eff9f4]" : "border-[#cbe7f6] bg-[#eef8fd]"}`}>
      <div className="mb-3 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-white/80 text-[#33635a]">{icon}</span>
        <p className="font-heading text-sm font-black">{title}</p>
      </div>
      {children}
    </div>
  );
}
