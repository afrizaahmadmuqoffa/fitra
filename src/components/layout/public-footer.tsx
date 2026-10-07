import Image from "next/image";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export function PublicFooter() {
  return (
    <footer className="border-t border-border py-7 text-[12px] text-muted-foreground">
      <div className="preview-container mx-auto flex flex-col items-start justify-between gap-5 px-4 md:flex-row md:items-center md:px-8">
        <div className="footer-brand flex items-center gap-2 font-extrabold text-[#33635a] dark:text-[#9fe7c8]">
          <Image
            src="/logo.png"
            alt=""
            aria-hidden
            width={28}
            height={28}
            className="size-7 rounded-[9px]"
          />
          {APP_NAME}
        </div>
        <div>Platform adaptasi pembelajaran SLB berbasis AI.</div>
        <div>© 2026 {APP_NAME}</div>
      </div>
    </footer>
  );
}