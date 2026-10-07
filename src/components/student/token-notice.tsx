import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatTanggal } from "@/components/dashboard/feedback";
import { AlertCircle, ArrowLeft, Clock3, Home, QrCode, RefreshCw, Sparkles } from "lucide-react";

type Status = "tidak-ditemukan" | "nonaktif" | "kedaluwarsa" | "data-siswa-tidak-ditemukan";

const COPY: Record<Status, { eyebrow: string; title: string; body: string; hint: string; accent: string; soft: string; icon: typeof AlertCircle }> = {
  "tidak-ditemukan": { eyebrow: "QR belum cocok", title: "Kita belum menemukan pintunya.", body: "Kode QR ini belum cocok dengan sesi belajar yang tersedia.", hint: "Minta guru memindai ulang kartu QR yang benar untukmu.", accent: "#33635a", soft: "#e5f7ee", icon: QrCode },
  nonaktif: { eyebrow: "Pintu sedang ditutup", title: "Belum bisa masuk sekarang.", body: "Akses belajar untuk sesi ini sedang dinonaktifkan oleh guru.", hint: "Bicarakan dengan guru lalu gunakan kartu QR baru saat akses sudah dibuka.", accent: "#8a5444", soft: "#fff0e8", icon: AlertCircle },
  kedaluwarsa: { eyebrow: "QR sudah selesai", title: "Kartu QR ini sudah lewat waktunya.", body: "Masa berlaku kartu QR yang kamu gunakan sudah habis.", hint: "Minta guru membuatkan atau memberikan kartu QR baru.", accent: "#5c668e", soft: "#eceefe", icon: Clock3 },
  "data-siswa-tidak-ditemukan": { eyebrow: "Data perlu dicek", title: "Data belajarmu belum ditemukan.", body: "Fitra belum menemukan data siswa untuk sesi ini.", hint: "Guru perlu memeriksa data kelas dan kartu QR yang digunakan.", accent: "#885157", soft: "#ffe9ec", icon: AlertCircle },
};

export function TokenNotice({ status, studentName, expiresAt, samples = [] }: { status: Status; studentName?: string; expiresAt?: string; token?: string; samples?: string[] }) {
  const copy = COPY[status];
  const Icon = copy.icon;

  return (
    <div className="relative flex min-h-[calc(100svh-4rem)] w-full items-center justify-center overflow-hidden px-4 py-8 text-[#17352f] sm:px-6">
      <div className="absolute -left-24 top-0 size-72 rounded-full bg-[#bfead4]/60 blur-3xl" aria-hidden="true" />
      <div className="absolute -right-24 bottom-0 size-72 rounded-full bg-[#ffd8bf]/60 blur-3xl" aria-hidden="true" />
      <div className="relative w-full max-w-3xl">
        <div className="overflow-hidden rounded-[3rem] border border-white/90 bg-white/82 shadow-[0_30px_90px_rgba(23,53,47,.12)] backdrop-blur-xl">
          <div className="relative p-6 sm:p-10 md:p-12">
            <div className="absolute right-6 top-6 grid size-10 rotate-12 place-items-center rounded-2xl bg-[#ffe9a6] text-[#735d18] sm:right-10 sm:top-10"><Sparkles className="size-5" /></div>
            <div className="mx-auto max-w-xl text-center">
              <div className="relative mx-auto grid size-24 place-items-center rounded-[2.25rem] bg-white shadow-[0_18px_50px_rgba(23,53,47,.10)]">
                <div className="absolute inset-2 rounded-[1.8rem] border-2 border-dashed" style={{ borderColor: `${copy.accent}28` }} />
                <span className="grid size-14 place-items-center rounded-2xl" style={{ backgroundColor: copy.soft, color: copy.accent }}><Icon className="size-7" /></span>
              </div>
              <p className="mt-6 text-xs font-black uppercase tracking-[0.18em]" style={{ color: `${copy.accent}99` }}>{copy.eyebrow}</p>
              <h1 className="mt-2 font-heading text-4xl font-black leading-[1.02] tracking-[-0.05em] sm:text-5xl">{copy.title}</h1>
              <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[#17352f]/62 sm:text-lg">{studentName ? `${studentName}, ` : ""}{copy.body}</p>
              <div className="mx-auto mt-5 max-w-xl rounded-[1.5rem] bg-[#f7f6ef] px-4 py-4 text-sm font-semibold leading-6 text-[#17352f]/55">{copy.hint}</div>
              {status === "kedaluwarsa" && expiresAt ? <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#eceefe] px-3.5 py-2 text-xs font-black text-[#5c668e]"><Clock3 className="size-3.5" /> Berlaku sampai {formatTanggal(expiresAt)}</div> : null}
              <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Button asChild size="lg" className="min-h-[var(--spacing-student-tap)] rounded-2xl bg-[#33635a] px-6 font-black text-white hover:bg-[#29574e] active:scale-[0.97]"><Link href="/"><Home className="size-5" /> Kembali ke Fitra</Link></Button>
                <Button asChild variant="outline" size="lg" className="min-h-[var(--spacing-student-tap)] rounded-2xl border-[#17352f]/10 bg-white font-bold text-[#17352f] active:scale-[0.97]"><Link href="/"><RefreshCw className="size-5" /> Coba lagi</Link></Button>
              </div>
            </div>
          </div>

          {samples.length > 0 ? (
            <div className="border-t border-[#17352f]/6 bg-[#fafaf5] p-5 sm:p-6">
              <div className="mx-auto max-w-xl"><p className="font-heading font-black">Pintu contoh</p><p className="mt-1 text-sm leading-6 text-[#17352f]/50">Untuk pengujian, gunakan salah satu token contoh yang tersedia.</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{samples.slice(0, 4).map((sample) => <Link key={sample} href={`/belajar/${sample}`} className="group flex min-h-12 items-center justify-between gap-3 rounded-2xl bg-white px-3.5 py-3 font-mono text-xs text-[#17352f]/65 shadow-sm ring-1 ring-black/[0.03] transition-transform duration-180 ease-out hover:-translate-y-0.5"><span className="truncate">{sample}</span><QrCode className="size-4 shrink-0 text-[#33635a]/55 transition-transform duration-180 group-hover:rotate-6" /></Link>)}</div></div>
            </div>
          ) : null}
        </div>
        <Link href="/" className="mx-auto mt-5 flex w-fit items-center gap-2 text-sm font-bold text-[#33635a] hover:underline"><ArrowLeft className="size-4" /> Kembali ke halaman utama</Link>
      </div>
    </div>
  );
}
