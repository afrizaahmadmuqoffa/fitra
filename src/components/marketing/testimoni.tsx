import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";

export function CtaDaftar() {
  return (
    <section className="border-t py-20 md:py-28">
      <div className="mx-auto flex max-w-[1400px] flex-col items-start gap-6 px-4 md:px-8">
        <Reveal>
          <h2 className="max-w-[26ch] text-3xl font-bold tracking-tight text-balance md:text-4xl">
            Mulai dengan kelas pertama Anda
          </h2>
          <p className="mt-4 max-w-[52ch] text-base leading-relaxed text-muted-foreground">
            Buat akun gratis, tambahkan siswa pertama, dan lihat bagaimana Fitra
            mengubah cara Anda mengajar.
          </p>
        </Reveal>
        <Button asChild size="lg" className="h-12 px-6 whitespace-nowrap">
          <Link href="/masuk">
            Daftar Gratis
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </section>
  );
}
