"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
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

const FONT_SCALE: Record<StudentProfile["uiTokens"]["fontSize"], number> = {
  low: 1.15,
  medium: 1,
  high: 1.3,
};

const StudentAdaptiveContext = React.createContext<{
  profile: SimulatedProfile;
  simulationProfile: SimulatedProfile;
  setSimulationProfileId: (id: string) => void;
  simulation: boolean;
  setSimulation: (value: boolean) => void;
  profiles: SimulatedProfile[];
} | null>(null);

export function useStudentAdaptive() {
  const context = React.useContext(StudentAdaptiveContext);
  if (!context) {
    throw new Error("Hook ini hanya boleh dipakai di dalam penyedia adaptif");
  }
  return context;
}

/**
 * Membungkus seluruh halaman siswa: menerapkan ukuran teks, kontras, dan gaya
 * navigasi dari student_profiles.ui_tokens. Mode simulasi Lets you mencoba
 * tampilan profil siswa lain tanpa memindai QR lain.
 */
export function StudentAdaptiveProvider({
  profiles,
  children,
}: {
  profiles: SimulatedProfile[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [simulationProfileId, setSimulationProfileId] = React.useState(
    profiles[0]?.id ?? "",
  );
  const [simulation, setSimulation] = React.useState(false);

  const tokenSegment = pathname.split("/")[2] ?? "";
  const actual = profiles.find((item) => item.token === tokenSegment) ?? profiles[0];
  const simulationProfile =
    profiles.find((item) => item.id === simulationProfileId) ?? profiles[0];
  const profile = simulation ? simulationProfile : actual;
  const tokens = profile.uiTokens;

  const value = React.useMemo(
    () => ({
      profile,
      simulationProfile,
      setSimulationProfileId,
      simulation,
      setSimulation,
      profiles,
    }),
    [profile, simulationProfile, simulation, profiles],
  );

  if (!profile) return <>{children}</>;

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

      <div className="no-print fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-3 py-2 backdrop-blur md:hidden">
        <ProfileSimulator />
      </div>
      <div className="no-print pointer-events-none fixed bottom-4 right-4 z-40 hidden md:block">
        <div className="pointer-events-auto">
          <ProfileSimulator />
        </div>
      </div>
    </StudentAdaptiveContext.Provider>
  );
}

function ProfileSimulator() {
  const { profile, simulationProfile, setSimulationProfileId, simulation, setSimulation, profiles } =
    useStudentAdaptive();

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
          <Switch id="simulasi-aktif" checked={simulation} onCheckedChange={setSimulation} />
        </div>

        <div className="mt-4 space-y-2">
          <Label htmlFor="simulasi-profil">Profil siswa</Label>
          <Select
            value={simulationProfile.id}
            onValueChange={setSimulationProfileId}
          >
            <SelectTrigger id="simulasi-profil">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {profiles.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name} - {item.disabilityLabel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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