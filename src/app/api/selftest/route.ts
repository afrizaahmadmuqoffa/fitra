import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { saveStudentFormAction } from "@/actions/students";
import { getTeacherChecklist } from "@/db/queries";

/**
 * Uji sehat Server Action (selftest).
 *
 * Halaman-halaman dashboard bisa saja tetap 200 padahal Server Action-nya
 * gagal dimuat, karena modul "use server" baru bermasalah saat aksinya
 * dipanggil. Endpoint ini memanggil satu action dengan data sengaja tidak
 * valid: kalau modulnya sehat, action mengembalikan `{ ok: false }` dengan
 * pesan validasi; kalau tidak, Permintaan ini berakhir 500.
 *
 * Endpoint ini tidak menulis apa pun ke database dan tidak membocorkan data.
 */
export async function GET() {
  const context = await getAuthContext();
  if (!context) {
    return NextResponse.json({ ok: false, reason: "belum masuk" }, { status: 401 });
  }

  try {
    const validation = await saveStudentFormAction({ values: {} });
    const checklist = await getTeacherChecklist();

    return NextResponse.json({
      ok: true,
      actionModule: "termuat",
      validationRejectedInvalidInput: validation.ok === false,
      checklistItems: checklist.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        reason: error instanceof Error ? error.message : "kesalahan tidak dikenal",
      },
      { status: 500 },
    );
  }
}