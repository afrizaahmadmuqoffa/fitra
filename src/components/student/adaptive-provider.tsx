"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { AUDIO_SPEED_LABELS, CONTRAST_LABELS, LEVEL_LABELS, NAV_STYLE_LABELS } from "@/lib/constants";
import { Sparkles, SlidersHorizontal } from "lucide-react";
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
  interactionModes: { touch: boolean; speech: boolean; keyboard: boolean; switch: boolean; drag: boolean };
  uiTokens: StudentProfile["uiTokens"];
};

export const DEFAULT_UI_TOKENS: StudentProfile["uiTokens"] = {
  fontSize: "medium",
  contrastMode: "normal",
  audioEnabled: true,
  audioSpeed: "normal",
  navStyle: "step",
};

const FONT_SCALE: Record<StudentProfile["uiTokens"]["fontSize"], number> = { low: 1.15, medium: 1, high: 1.3 };

const StudentAdaptiveContext = React.createContext<{
  profile: SimulatedProfile;
  simulationProfile: SimulatedProfile | null;
  setSimulationProfileId: (id: string) => void;
  simulation: boolean;
  setSimulation: (value: boolean) => void;
  candidates: SimulatedProfile[];
} | null>(null);

export function useStudentAdaptive() {
  const context = React.useContext(StudentAdaptiveContext);
  if (!context) throw new Error("Hook ini hanya boleh dipakai di dalam penyedia adaptif");
  return context;
}

export type { StudentProfile };

export function StudentAdaptiveProvider({ profile, candidates = [], children }: { profile: SimulatedProfile; candidates?: SimulatedProfile[]; children: React.ReactNode }) {
  const [simulationProfileId, setSimulationProfileId] = React.useState(candidates[0]?.id ?? "");
  const [simulation, setSimulation] = React.useState(false);
  const [overrides, setOverrides] = React.useState<StudentOverrides>({});

  const simulationProfile = candidates.find((item) => item.id === simulationProfileId) ?? candidates[0] ?? null;
  const effective = simulation && simulationProfile ? simulationProfile : profile;
  const tokens: StudentProfile["uiTokens"] = {
    fontSize: overrides.fontSize ?? effective.uiTokens.fontSize,
    contrastMode: overrides.contrastMode ?? effective.uiTokens.contrastMode,
    audioEnabled: overrides.audioEnabled ?? effective.uiTokens.audioEnabled,
    audioSpeed: overrides.audioSpeed ?? effective.uiTokens.audioSpeed,
    navStyle: effective.uiTokens.navStyle,
  };

  const value = React.useMemo(() => ({ profile: effective, simulationProfile, setSimulationProfileId, simulation, setSimulation, candidates }), [effective, simulationProfile, simulation, candidates]);

  return (
    <StudentAdaptiveContext.Provider value={value}>
      <div className={cn("student-surface relative min-h-[60dvh] flex-col", tokens.contrastMode === "high" && "student-contrast")} style={{ ["--student-scale" as string]: FONT_SCALE[tokens.fontSize] }}>
        {children}
      </div>
      <StudentControls defaults={effective.uiTokens} onChange={setOverrides} />

      {candidates.length > 0 ? (
        <div className="no-print fixed bottom-4 right-4 z-40 hidden md:block">
          <ProfileSimulator />
        </div>
      ) : null}
      {candidates.length > 0 ? (
        <div className="no-print fixed inset-x-3 bottom-3 z-40 md:hidden">
          <ProfileSimulator />
        </div>
      ) : null}
    </StudentAdaptiveContext.Provider>
  );
}

function ProfileSimulator() {
  const { profile, simulationProfile, setSimulationProfileId, simulation, setSimulation, candidates } = useStudentAdaptive();
  const interactions = Object.entries(profile.interactionModes).filter(([, enabled]) => enabled).map(([key]) => key).join(", ");

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="h-11 rounded-2xl border border-white/80 bg-[#17352f] px-4 font-bold text-white shadow-[0_12px_30px_rgba(23,53,47,.18)] hover:bg-[#244a42] active:scale-[0.97]" variant="default">
          <SlidersHorizontal className="size-4" />
          <span className="hidden sm:inline">Pratinjau profil</span>
          <Sparkles className="size-4 text-[#bfead4]" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[88dvh] overflow-y-auto rounded-t-[2rem] border-[#17352f]/8 bg-[#fdfcf8]">
        <div className="mx-auto w-full max-w-2xl">
          <SheetTitle className="font-heading text-2xl font-black text-[#17352f]">Pratinjau cara siswa melihat Fitra</SheetTitle>
          <p className="mt-2 text-sm leading-6 text-[#17352f]/55">Gunakan ini untuk mengecek apakah adaptasi tampilan terasa benar sebelum siswa memakainya.</p>

          <div className="mt-5 flex items-center justify-between gap-3 rounded-[1.5rem] bg-[#eff9f4] p-4">
            <div>
              <Label htmlFor="simulasi-aktif" className="font-heading font-black">Mode simulasi</Label>
              <p className="mt-0.5 text-xs text-[#17352f]/50">Tidak mengubah data siswa asli.</p>
            </div>
            <Switch id="simulasi-aktif" checked={simulation} disabled={!simulationProfile} onCheckedChange={setSimulation} />
          </div>

          <div className="mt-4 space-y-2">
            <Label htmlFor="simulasi-profil" className="font-bold">Profil siswa</Label>
            <Select value={simulationProfile?.id ?? profile.id} onValueChange={setSimulationProfileId}>
              <SelectTrigger id="simulasi-profil" className="min-h-12 rounded-2xl border-[#17352f]/10 bg-white font-bold"><SelectValue /></SelectTrigger>
              <SelectContent>
                {candidates.map((item) => <SelectItem key={item.id} value={item.id}>{item.name} · {item.disabilityLabel}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-5 rounded-[1.75rem] border border-[#17352f]/8 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <Avatar className="size-14 border-2 border-[#bfead4]">
                <AvatarImage src={profile.photoUrl} alt="" />
                <AvatarFallback className="bg-[#33635a] font-black text-white">{profile.nickname.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-heading font-black">{profile.name}</p>
                <p className="text-xs text-[#17352f]/50">{profile.disabilityLabel} · {LEVEL_LABELS[profile.academicLevel]}</p>
              </div>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
              <MiniSetting label="Teks" value={profile.uiTokens.fontSize} />
              <MiniSetting label="Kontras" value={CONTRAST_LABELS[profile.uiTokens.contrastMode]} />
              <MiniSetting label="Audio" value={AUDIO_SPEED_LABELS[profile.uiTokens.audioSpeed]} />
              <MiniSetting label="Navigasi" value={NAV_STYLE_LABELS[profile.uiTokens.navStyle]} />
              <MiniSetting label="Interaksi" value={interactions || "belum ada"} wide />
            </dl>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MiniSetting({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={cn("rounded-2xl bg-[#f8f8f2] p-3", wide && "sm:col-span-2")}>
      <dt className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#17352f]/35">{label}</dt>
      <dd className="mt-1 font-semibold text-[#17352f]">{value}</dd>
    </div>
  );
}
