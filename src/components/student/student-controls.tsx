"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Settings } from "lucide-react";
import {
  AUDIO_SPEED_LABELS,
  CONTRAST_LABELS,
  LEVEL_LABELS,
} from "@/lib/constants";
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

interface StudentControlsProps {
  defaults: StudentProfile["uiTokens"];
  onChange: (overrides: StudentOverrides) => void;
}

export function StudentControls({ defaults, onChange }: StudentControlsProps) {
  const [open, setOpen] = React.useState(false);
  const [overrides, setOverrides] = React.useState<StudentOverrides>(() => {
    if (typeof window === "undefined") return {};
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as StudentOverrides;
        onChange(parsed);
        return parsed;
      }
    } catch {}
    return {};
  });

  const fontSize = overrides.fontSize ?? defaults.fontSize;
  const contrastMode = overrides.contrastMode ?? defaults.contrastMode;
  const audioEnabled = overrides.audioEnabled ?? defaults.audioEnabled;
  const audioSpeed = overrides.audioSpeed ?? defaults.audioSpeed;

  const updateOverride = <K extends keyof StudentOverrides>(
    key: K,
    value: StudentOverrides[K]
  ) => {
    const next = { ...overrides, [key]: value };
    setOverrides(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
    onChange(next);
  };

  const resetOverrides = () => {
    setOverrides({});
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    onChange({});
  };

  const hasOverrides = Object.keys(overrides).length > 0;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 left-4 z-50 size-12 rounded-full shadow-lg md:bottom-6 md:left-6"
          aria-label="Pengaturan tampilan"
        >
          <Settings className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[80dvh] overflow-y-auto">
        <SheetTitle className="text-left">Pengaturan tampilan</SheetTitle>
        <p className="mt-2 text-sm text-muted-foreground">
          Ubah tampilan sesuai kebutuhanmu. Pengaturan ini hanya berlaku di
          perangkat ini.
        </p>

        <div className="mt-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="fontSize">Ukuran teks</Label>
            <Select
              value={fontSize}
              onValueChange={(v) => updateOverride("fontSize", v as FontSize)}
            >
              <SelectTrigger id="fontSize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">{LEVEL_LABELS.low}</SelectItem>
                <SelectItem value="medium">{LEVEL_LABELS.medium}</SelectItem>
                <SelectItem value="high">{LEVEL_LABELS.high}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contrastMode">Kontras warna</Label>
            <Select
              value={contrastMode}
              onValueChange={(v) =>
                updateOverride("contrastMode", v as ContrastMode)
              }
            >
              <SelectTrigger id="contrastMode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">
                  {CONTRAST_LABELS.normal}
                </SelectItem>
                <SelectItem value="high">{CONTRAST_LABELS.high}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
            <div>
              <Label htmlFor="audioEnabled" className="text-sm font-medium">
                Aktifkan audio
              </Label>
              <p className="text-xs text-muted-foreground">
                Bacakan teks dengan suara
              </p>
            </div>
            <Switch
              id="audioEnabled"
              checked={audioEnabled}
              onCheckedChange={(v) => updateOverride("audioEnabled", v)}
            />
          </div>

          {audioEnabled && (
            <div className="space-y-2">
              <Label htmlFor="audioSpeed">Kecepatan audio</Label>
              <Select
                value={audioSpeed}
                onValueChange={(v) =>
                  updateOverride("audioSpeed", v as AudioSpeed)
                }
              >
                <SelectTrigger id="audioSpeed">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slow">{AUDIO_SPEED_LABELS.slow}</SelectItem>
                  <SelectItem value="normal">
                    {AUDIO_SPEED_LABELS.normal}
                  </SelectItem>
                  <SelectItem value="fast">
                    {AUDIO_SPEED_LABELS.fast}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {hasOverrides && (
            <Button
              variant="outline"
              className="w-full"
              onClick={resetOverrides}
            >
              Kembalikan ke pengaturan awal
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
