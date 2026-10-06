import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";

export function CtaDaftar() {
  return (
    <section className="final-cta py-5 pb-[105px]">
      <div className="preview-container mx-auto px-4 md:px-8">
        <div className="cta-card reveal relative overflow-hidden rounded-[30px] bg-gradient-to-br from-[#33635a] to-[#3d7368] p-[52px] text-white shadow-[0_22px_55px_rgba(35,63,57,0.12)] before:absolute before:-bottom-[90px] before:left-[48%] before:size-[130px] before:rounded-full before:bg-[rgba(255,225,210,0.14)] before:content-[''] after:absolute after:-right-[80px] after:-top-[115px] after:size-[260px] after:rounded-full after:bg-[rgba(217,243,233,0.18)] after:content-['']">
          <div className="cta-card-inner relative z-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between md:gap-8">
            <div>
              <div className="section-kicker text-[#bfe9d9]">Mulai dari kelas pertama Anda</div>
              <h2 className="max-w-[650px] text-[clamp(32px,4.2vw,55px)] font-heading leading-[1.04] tracking-[-0.04em]">
                Lebih sedikit waktu menyesuaikan materi. Lebih banyak waktu untuk mengajar.
              </h2>
              <p className="mt-3 max-w-[620px] text-[15px] leading-[1.8] text-[#d9ece6]">
                Buat akun gratis, tambahkan siswa pertama, dan lihat bagaimana Fitra mengubah cara Anda menyiapkan
                pembelajaran.
              </p>
            </div>
            <div className="cta-action flex-shrink-0">
              <Button asChild size="lg" className="btn btn-large h-[54px] min-h-[54px] rounded-[16px] bg-white px-5 text-[14px] font-extrabold text-[#33635a] shadow-none hover:bg-[#f5faf8]">
                <Link href="/masuk">
                  Daftar Gratis
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
