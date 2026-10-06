import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export function PublicFooter() {
  return (
    <footer className="border-t border-[#dce7e2] py-7 text-[12px] text-[#798782]">
      <div className="preview-container mx-auto flex flex-col items-start justify-between gap-5 px-4 md:flex-row md:items-center md:px-8">
        <div className="footer-brand flex items-center gap-2 font-extrabold text-[#33635a]">
          <span className="brand-mark grid size-7 place-items-center rounded-[9px] bg-[#33635a] text-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 6.5C6 5.67 6.67 5 7.5 5h9A1.5 1.5 0 0 1 18 6.5V17a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6.5Z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path d="M9 9h6M9 12h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          {APP_NAME}
        </div>
        <div>Platform adaptasi pembelajaran SLB berbasis AI.</div>
        <div>© 2026 {APP_NAME}</div>
      </div>
    </footer>
  );
}