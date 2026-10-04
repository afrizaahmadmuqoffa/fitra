"use client";

import * as React from "react";
import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { completeOnboardingAction } from "@/actions/auth";

/**
 * Tur dashboard guru (Bab 7).
 *
 * Menggantikan halaman Panduan yang dulu ada di landing page: penjelasan
 * fitur sekarang muncul langsung di atas UI yang sedang dipakai guru.
 * Alur yang disorot: profil siswa -> unggah materi -> review adaptasi ->
 * terbitkan -> QR kelas -> monitor progres.
 *
 * Aturan:
 * - Hanya sekali. Status disimpan di `profiles.onboarding_completed` dan
 *   di-set dari `onDestroyed`, sehingga selesai maupun dilewati sama-sama
 *   menandai selesai.
 * - Bisa diulang dari /dashboard/pengaturan (`resetOnboardingAction`).
 * - Target yang tidak ada atau tidak terlihat (mis. sidebar yang `hidden`
 *   di layar kecil) otomatis dilewati, bukan menampilkan popover melayang
 *   di tengah layar.
 */

/** Jeda sebelum tur dinyalakan, agar statistik dan tombol selesai dirender. */
const DELAY_MS = 700;

/**
 * Resolver target yang sadar visibilitas.
 *
 * `document.querySelector` tetap menemukan sidebar meskipun elemen itu
 * `hidden` di bawah `lg`, padahal `getClientRects()` kosong sehingga
 * driver.js akan memotong lubang 0x0 di pojok kiri atas. Mengembalikan
 * `null` membuat driver.js melewati langkah itu (butuh
 * `skipMissingElement: true`).
 */
function target(selector: string): () => Element {
  return () => {
    const el = document.querySelector(selector);
    if (!el || el.getClientRects().length === 0) {
      return null as unknown as Element;
    }
    return el;
  };
}

const STEPS: DriveStep[] = [
  {
    element: target("[data-tour='dashboard-title']"),
    popover: {
      title: "Selamat datang di Fitra",
      description:
        "Enam langkah ini adalah alur kerja harian Anda: dari profil siswa sampai dokumen PPI. Ikuti sekali saja, lalu pakai sesuka hati kapan pun dari menu akun.",
    },
  },
  {
    element: target("[data-tour='aksi-siswa']"),
    popover: {
      title: "1. Profil siswa",
      description:
        "Mulai dari siswa. Isi hambatan, tingkat akademik, preferensi belajar, dan mode interaksi. Data inilah yang jadi dasar AI menulis ulang materi untuk masing-masing anak.",
    },
  },
  {
    element: target("[data-tour='aksi-materi']"),
    popover: {
      title: "2. Unggah materi",
      description:
        "Unggah PDF atau DOCX yang biasa Anda pakai. AI membaginya jadi bagian-bagian kecil, mengukur tingkat baca, dan menandai bagian yang butuh ilustrasi.",
    },
  },
  {
    element: target("[data-tour='stat-review']"),
    popover: {
      title: "3. Review adaptasi",
      description:
        "Adaptasi per siswa menunggu di sini. Buka, ubah bila perlu, lalu setujui. Adaptasi Anda tidak pernah tampil ke siswa sebelum Anda tekan setujui.",
    },
  },
  {
    element: target("[data-tour='stat-materi']"),
    popover: {
      title: "4. Terbitkan materi",
      description:
        "Adaptasi yang disetujui belum cukup. Buka halaman materi dan tekan Terbitkan. Hanya setelah itu siswa bisa membukanya lewat QR.",
    },
  },
  {
    element: target("[data-tour='nav-kelas']"),
    popover: {
      title: "5. QR untuk siswa",
      description:
        "Buat token QR per siswa di menu Kelas. Token inilah cara siswa masuk tanpa password, jadi perlakukan seperti kunci lemari.",
    },
  },
  {
    element: target("[data-tour='nav-progres']"),
    popover: {
      title: "6. Monitor progres",
      description:
        "Sesi belajar, durasi, dan tingkat penyelesaian tercatat otomatis di menu Progres. Data inilah yang menyusun dokumen PPI tanpa Anda tulis manual.",
    },
  },
  {
    popover: {
      title: "Siap",
      description:
        "Tur ini tidak akan muncul lagi. Untuk mengulang kapan saja, buka menu akun di kanan atas lalu pilih Pengaturan. Selamat mengajar.",
    },
  },
];

export function OnboardingWizard({ show }: { show: boolean }) {
  const dibongkarOtomatis = React.useRef(false);

  React.useEffect(() => {
    if (!show) return;

    let instance: ReturnType<typeof driver> | null = null;

    const timer = window.setTimeout(() => {
      instance = driver({
        steps: STEPS,
        animate: true,
        duration: 320,
        smoothScroll: true,
        allowClose: true,
        overlayColor: "rgb(9 9 11 / 0.72)",
        overlayOpacity: 1,
        skipMissingElement: true,
        showProgress: true,
        progressText: "Langkah {{current}} dari {{total}}",
        nextBtnText: "Lanjut",
        prevBtnText: "Kembali",
        doneBtnText: "Selesai",
        closeBtnLabel: "Tutup tur",
        stagePadding: 6,
        stageRadius: 8,
        popoverClass: "fitra-tour",
        onDestroyed: () => {
          if (dibongkarOtomatis.current) return;
          void completeOnboardingAction();
        },
      });
      instance.drive();
    }, DELAY_MS);

    return () => {
      window.clearTimeout(timer);
      // Unmount (mis. guru pindah halaman di tengah tur) bukan berarti selesai.
      dibongkarOtomatis.current = true;
      instance?.destroy();
    };
  }, [show]);

  return null;
}