import { DISABILITY_LABELS } from "@/lib/constants";
import type { SimulatedProfile } from "@/components/student/adaptive-provider";
import type { Student, StudentProfile } from "@/db/types";

/**
 * Mengubah data siswa dari database menjadi profil untuk halaman siswa.
 * Dipakai oleh layout dan keempat halaman `/belajar/*` agar setelan
 * tampilan selalu mengikuti profil belajar yang tersimpan.
 */
export function toSimulatedProfile(input: {
  student: Student;
  profile: StudentProfile | null;
  token: string;
}): SimulatedProfile {
  const { student, profile, token } = input;
  const level = profile?.academicLevel ?? "medium";

  return {
    id: student.id,
    token,
    name: student.fullName,
    nickname: student.nickname,
    photoUrl: student.photoUrl,
    disabilityLabel: DISABILITY_LABELS[student.disabilityType] ?? student.disabilityType,
    academicLevel: level,
    interactionModes: profile?.interactionModes ?? {
      touch: true,
      speech: false,
      keyboard: false,
      switch: false,
      drag: false,
    },
    uiTokens: profile?.uiTokens ?? {
      fontSize: level,
      contrastMode: "normal",
      audioEnabled: true,
      audioSpeed: "normal",
      navStyle: "step",
    },
  };
}