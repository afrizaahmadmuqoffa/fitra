import type { ReactNode } from "react";
import { StudentAdaptiveProvider } from "@/components/student/adaptive-provider";
import { getSimulatedProfiles } from "@/db/queries/student";
import { readRevealedTokens } from "@/lib/token-reveal";
import { toSimulatedProfile } from "@/lib/student-profile";
import type { Student, StudentProfile } from "@/db/types";

/**
 * Pembungkus halaman siswa: menerapkan ukuran teks, kontras, dan gaya navigasi
 * dari profil belajar siswa pemilik token, lalu menyalakan Mode Simulasi
 * untuk profil lain yang token-nya sudah pernah dibuat di peramban ini.
 */
export async function StudentAdaptiveShell({
  student,
  profile,
  token,
  children,
}: {
  student: Student;
  profile: StudentProfile | null;
  token: string;
  children: ReactNode;
}) {
  const revealed = await readRevealedTokens();
  const candidates = await getSimulatedProfiles(revealed);

  return (
    <StudentAdaptiveProvider
      profile={toSimulatedProfile({ student, profile, token })}
      candidates={candidates}
    >
      {children}
    </StudentAdaptiveProvider>
  );
}