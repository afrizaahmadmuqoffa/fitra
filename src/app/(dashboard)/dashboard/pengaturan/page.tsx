import type { Metadata } from "next";
import { getTeacher } from "@/lib/dummy/queries";
import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsForm } from "@/components/dashboard/pengaturan/settings-form";

export const metadata: Metadata = {
  title: "Pengaturan Akun",
  description:
    "Profil guru, sekolah, preferensi notifikasi in-app, tampilan aplikasi, dan keamanan akun.",
};

export default async function SettingsPage() {
  const teacher = await getTeacher();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan"
        description="Kelola profil guru dan sekolah, pilih notifikasi yang ingin Anda terima, serta amankan akun Anda."
      />

      <SettingsForm teacher={teacher} />
    </div>
  );
}