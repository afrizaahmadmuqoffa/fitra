"use client";

import * as React from "react";


import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  AUDIO_SPEED_LABELS,
  CONTRAST_LABELS,
  LEVEL_LABELS,
  NAV_STYLE_LABELS,
} from "@/lib/constants";
import { SlidersHorizontal } from "lucide-react";
import type { StudentProfile } from "@/lib/dummy/types";
import { StudentControls, type StudentOverrides } from "./student-controls";

export type SimulatedProfile = {
  id: string;
  token: string;
  name: string;
  nickname: string;
  photoUrl: string;
  disabilityLabel: string;
  academicLevel: StudentProfile["academicLevel"];
  interactionModes: {
    touch: boolean;
    speech: boolean;
    keyboard: boolean;
    switch: boolean;
    drag: boolean;
  };
  uiTokens: StudentProfile["uiTokens"];
};

/** Setelan tampilan paling netral, dipakai bila profil belum tersedia. */
export const DEFAULT_UI_TOKENS: StudentProfile["uiTokens"] = {
  fontSize: "medium",
  contrastMode: "normal",
  audioEnabled: true,
  audioSpeed: "normal",
  navStyle: "step",
};

const FONT_SCALE: Record<StudentProfile["uiTokens"]["fontSize"], number> = {
  low: 1.15,
  medium: 1,
  high: 1.3,
};

const StudentAdaptiveContext = React.createContext<{
  profile: SimulatedProfile;
  simulationProfile: SimulatedProfile | null;
  setSimulationProfileId: (id: string) => void;
  simulation: boolean;
  setSimulation: (value: boolean) => void;
  /** Profil yang bisa dipilih di Mode Simulasi. */
  candidates: SimulatedProfile[];
} | null>(null);

export function useStudentAdaptive() {
  const context = React.useContext(StudentAdaptiveContext);
  if (!context) {
    throw new Error("Hook ini hanya boleh dipakai di dalam penyedia adaptif");
  }
  return context;
}

export type { StudentProfile };

/**
 * Membungkus halaman siswa: menerapkan ukuran teks, kontras, dan gaya navigasi
 * dari profil belajar siswa pemilik token yang sedang dibuka.
 *
 * Mode Simulasi memakai daftar profil yang sudah pernah guru tampilkan lewat
 * tombol Buat QR atau Rotasi di halaman kartu QR kelas. Karena database hanya
 * menyimpan hash token, daftar itu tidak bisa diambil ulang dari server.
 */
export function StudentAdaptiveProvider({
  profile,
  candidates = [],
  children,
}: {
  profile: SimulatedProfile;
  candidates?: SimulatedProfile[];
  children: React.ReactNode;
}) {
  const [simulationProfileId, setSimulationProfileId] = React.useState(
    candidates[0]?.id ?? "",
  );
  const [simulation, setSimulation] = React.useState(false);
  const [overrides, setOverrides] = React.useState<StudentOverrides>({});

  const simulationProfile =
    candidates.find((item) => item.id === simulationProfileId) ?? candidates[0] ?? null;
  const effective = simulation && simulationProfile ? simulationProfile : profile;
  
  const tokens: StudentProfile["uiTokens"] = {
    fontSize: overrides.fontSize ?? effective.uiTokens.fontSize,
    contrastMode: overrides.contrastMode ?? effective.uiTokens.contrastMode,
    audioEnabled: overrides.audioEnabled ?? effective.uiTokens.audioEnabled,
    audioSpeed: overrides.audioSpeed ?? effective.uiTokens.audioSpeed,
    navStyle: effective.uiTokens.navStyle,
  };

  const value = React.useMemo(
    () => ({
      profile: effective,
      simulationProfile,
      setSimulationProfileId,
      simulation,
      setSimulation,
      candidates,
    }),
    [effective, simulationProfile, simulation, candidates],
  );

  return (
    <StudentAdaptiveContext.Provider value={value}>
      <div
        className={cn(
          "student-surface flex min-h-[60dvh] flex-col",
          tokens.contrastMode === "high" && "student-contrast",
        )}
        style={{ ["--student-scale" as string]: FONT_SCALE[tokens.fontSize] }}
      >
        {children}
      </div>

      <StudentControls defaults={effective.uiTokens} onChange={setOverrides} />

      {candidates.length > 0 ? (
        <>
          <div className="no-print fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-3 py-2 backdrop-blur md:hidden">
            <ProfileSimulator />
          </div>
          <div className="no-print pointer-events-none fixed bottom-4 right-4 z-40 hidden md:block">
            <div className="pointer-events-auto">
              <ProfileSimulator />
            </div>
          </div>
        </>
      ) : null}
    </StudentAdaptiveContext.Provider>
  );
}

function ProfileSimulator() {
  const {
    profile,
    simulationProfile,
    setSimulationProfileId,
    simulation,
    setSimulation,
    candidates,
  } = useStudentAdaptive();

  const interactions = Object.entries(profile.interactionModes)
    .filter(([, enabled]) => enabled)
    .map(([key]) => key)
    .join(", ");

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full md:w-auto">
          <SlidersHorizontal />
          Mode simulasi profil
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto">
        <SheetTitle className="text-left">Mode simulasi profil</SheetTitle>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Coba tampilan layar seperti yang dilihat siswa lain. Pengaturan ini hanya
          berlaku di perangkat ini dan tidak mengubah data asli.
        </p>

        <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border p-3">
          <div>
            <Label htmlFor="simulasi-aktif" className="text-sm font-medium">
              Aktifkan simulasi
            </Label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Memakai profil pilihan di bawah, bukan profil siswa sebenarnya.
            </p>
          </div>
          <Switch
            id="simulasi-aktif"
            checked={simulation}
            disabled={!simulationProfile}
            onCheckedChange={setSimulation}
          />
        </div>

        <div className="mt-4 space-y-2">
          <Label htmlFor="simulasi-profil">Profil siswa</Label>
          <Select
            value={simulationProfile?.id ?? profile.id}
            onValueChange={setSimulationProfileId}
          >
            <SelectTrigger id="simulasi-profil">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {candidates.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name} - {item.disabilityLabel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Daftar ini berisi siswa yang token QR-nya sudah pernah Anda buat atau rotasi
            di peramban ini, karena server hanya menyimpan hash token.
          </p>
        </div>

        <div className="mt-5 space-y-4 rounded-lg border p-4">
          <p className="text-sm font-semibold">Pratinjau profil aktif</p>
          <div className="flex items-center gap-3">
            <Avatar className="size-12">
              <AvatarImage src={profile.photoUrl} alt="" />
              <AvatarFallback>{profile.nickname.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-heading text-sm font-semibold">{profile.name}</p>
              <p className="text-xs text-muted-foreground">
                {profile.disabilityLabel} - {LEVEL_LABELS[profile.academicLevel]}
              </p>
            </div>
          </div>
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Ukuran teks</dt>
              <dd className="font-medium">{profile.uiTokens.fontSize}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Kontras</dt>
              <dd className="font-medium">{CONTRAST_LABELS[profile.uiTokens.contrastMode]}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Kecepatan audio</dt>
              <dd className="font-medium">{AUDIO_SPEED_LABELS[profile.uiTokens.audioSpeed]}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Gaya navigasi</dt>
              <dd className="font-medium">{NAV_STYLE_LABELS[profile.uiTokens.navStyle]}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Bentuk interaksi</dt>
              <dd className="font-medium">{interactions || "belum ada"}</dd>
            </div>
          </dl>
        </div>
      </SheetContent>
    </Sheet>
  );
}