import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="hero relative isolate flex min-h-[700px] items-center overflow-hidden px-4 md:px-8 md:py-24">
      <div className="hero-decoration hero-spark pointer-events-none" aria-hidden="true"></div>
      <div className="hero-decoration hero-orb pointer-events-none" aria-hidden="true"></div>
      <div className="hero-decoration hero-dot pointer-events-none" aria-hidden="true"></div>
      <div className="preview-container hero-grid mx-auto w-full">
        <div className="hero-copy-wrap reveal mx-auto max-w-[890px] text-center">
          <span className="eyebrow inline-flex items-center gap-2 rounded-full border border-[rgba(51,99,90,0.08)] bg-[rgba(217,243,233,0.86)] px-[13px] py-[9px] text-[12px] font-extrabold tracking-[0.02em] text-[#33635a] shadow-[0_10px_24px_rgba(51,99,90,0.06)] before:size-[7px] before:rounded-full before:bg-[#33635a] before:shadow-[0_0_0_5px_rgba(51,99,90,0.08)] dark:bg-[rgba(51,99,90,0.25)] dark:border-[rgba(51,99,90,0.3)] dark:text-[#9fe7c8]">
            Platform adaptasi pembelajaran SLB
          </span>
          <h1 className="mt-6 mx-auto max-w-[900px] text-[clamp(50px,7.2vw,88px)] font-heading leading-[0.98] tracking-[-0.04em]">
            Satu Materi,<br />
            <span className="block text-[#33635a] dark:text-[#9fe7c8]">Banyak Cara Belajar.</span>
          </h1>
          <span
            className="hero-underline mx-auto mt-[13px] block h-[11px] w-[135px] rotate-[-1.2deg] rounded-full bg-gradient-to-r from-[rgba(51,99,90,0.08)] via-[rgba(51,99,90,0.28)] to-[rgba(51,99,90,0.08)]"
            aria-hidden="true"
          ></span>
          <p className="hero-copy mx-auto mt-6 mb-8 max-w-[700px] text-[18px] leading-[1.75] text-[#657671] dark:text-muted-foreground">
            Fitra mengubah satu materi pelajaran menjadi versi yang menyesuaikan kemampuan, media, dan cara interaksi
            setiap siswa SLB.
          </p>
          <div className="hero-ctas flex flex-wrap items-center justify-center gap-[11px]">
            <Button asChild size="lg" className="btn btn-primary btn-large h-[54px] min-h-[54px] rounded-[16px] bg-[#33635a] px-5 text-[14px] font-extrabold text-white shadow-[0_10px_24px_rgba(51,99,90,0.2)] hover:bg-[#254d46] hover:shadow-[0_14px_30px_rgba(51,99,90,0.24)]">
              <Link href="/masuk">
                Daftar Gratis
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="btn btn-soft btn-large h-[54px] min-h-[54px] rounded-[16px] border-border bg-background/70 px-5 text-[14px] font-extrabold text-[#33635a] hover:bg-background hover:border-border dark:text-[#9fe7c8]">
              <Link href="/#cara-kerja">Lihat Cara Kerja</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}