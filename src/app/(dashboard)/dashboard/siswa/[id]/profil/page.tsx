import { redirect } from "next/navigation";

/**
 * Rute lama. Wizard profil 4 langkah sudah dilebur ke dalam satu wizard siswa,
 * jadi halaman ini hanya meneruskan ke /dashboard/siswa/<id>/ubah supaya
 * tautan lama di notifikasi dan bookmark tidak mati mendadak.
 */
export default async function StudentProfileRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/siswa/${id}/ubah`);
}