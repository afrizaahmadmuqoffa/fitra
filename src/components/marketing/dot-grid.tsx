/**
 * Dot grid pattern for Hero background.
 * Warna memakai currentColor di dalam text-muted-foreground sehingga
 * otomatis menyesuaikan theme terang dan gelap.
 */
export function DotGrid() {
  return (
    <div
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden text-muted-foreground/35"
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at center, currentColor 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          maskImage:
            "radial-gradient(ellipse 75% 65% at 50% 45%, black 0%, black 40%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 75% 65% at 50% 45%, black 0%, black 40%, transparent 100%)",
        }}
      />
    </div>
  );
}
