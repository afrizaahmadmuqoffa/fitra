import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

const columns = [
  {
    heading: "Produk",
    links: [
      { label: "Fitur", href: "/#fitur" },
      { label: "Cara kerja", href: "/#cara-kerja" },
      { label: "Solusi", href: "/#solusi" },
    ],
  },
  {
    heading: "Perusahaan",
    links: [{ label: "Tentang Fitra", href: "/#tentang" }],
  },
  {
    heading: "Mulai",
    links: [{ label: "Daftar gratis", href: "/masuk" }],
  },
];

export function PublicFooter() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-4 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)] md:px-8">
        <div>
          <p className="font-heading text-lg font-bold tracking-tight">{APP_NAME}</p>
          <p className="mt-3 max-w-[38ch] text-sm leading-relaxed text-muted-foreground">
            Platform adaptasi pembelajaran untuk guru Sekolah Luar Biasa. Guru
            mengolah, AI membantu menyesuaikan, siswa belajar dengan cara yang
            paling mudah baginya.
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.heading}>
            <h2 className="text-sm font-semibold">{col.heading}</h2>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-2 px-4 py-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-8">
          <p>
            {APP_NAME} dibangun untuk guru SLB di Indonesia. Digunakan gratis
            pada versi awal.
          </p>
          <p>Hak cipta {APP_NAME} 2026</p>
        </div>
      </div>
    </footer>
  );
}