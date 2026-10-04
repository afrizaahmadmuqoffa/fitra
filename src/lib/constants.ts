/** Z-INDEX SCALE (systemic layers only, no arbitrary z-50 spam). */
export const Z = {
  base: 0,
  raised: 10,
  sticky: 30,
  sidebar: 40,
  header: 50,
  overlay: 60,
  modal: 70,
  toast: 80,
} as const;

export const APP_NAME = "Fitra";
export const APP_TAGLINE = "Satu Materi, Banyak Cara Belajar";

export const DISABILITY_LABELS: Record<string, string> = {
  tunanetra: "Tunanetra (A)",
  tunarungu: "Tunarungu (B)",
  tunagrahita: "Tunagrahita (C)",
  tunadaksa: "Tunadaksa (D)",
  tunalaras: "Tunalaras",
  autis: "Autisme",
  tunawicara: "Tunawicara",
  tunaganda: "Tunaganda",
  lainnya: "Lainnya",
};

export const DISABILITY_SHORT: Record<string, string> = {
  tunanetra: "Tunanetra",
  tunarungu: "Tunarungu",
  tunagrahita: "Tunagrahita",
  tunadaksa: "Tunadaksa",
  tunalaras: "Tunalaras",
  autis: "Autisme",
  tunawicara: "Tunawicara",
  tunaganda: "Tunaganda",
  lainnya: "Lainnya",
};

export const MATERIAL_STATUS: Record<
  string,
  { label: string; tone: "muted" | "info" | "warning" | "success" }
> = {
  draft: { label: "Draft", tone: "muted" },
  pending_ai: { label: "Diproses AI", tone: "info" },
  ai_ready: { label: "Siap Review", tone: "warning" },
  published: { label: "Terbit", tone: "success" },
};

export const ADAPTATION_STATUS: Record<
  string,
  { label: string; tone: "muted" | "info" | "warning" | "success" | "destructive" }
> = {
  generating: { label: "Sedang dibuat", tone: "info" },
  draft: { label: "Menunggu review", tone: "warning" },
  edited: { label: "Disunting guru", tone: "info" },
  approved: { label: "Disetujui", tone: "success" },
  rejected: { label: "Ditolak guru", tone: "destructive" },
  failed: { label: "Gagal dibuat", tone: "destructive" },
};

export const VISUAL_ASSET_STATUS: Record<
  string,
  { label: string; tone: "muted" | "info" | "warning" | "success" | "destructive" }
> = {
  pending: { label: "Menunggu", tone: "muted" },
  generating: { label: "Dibuat AI", tone: "info" },
  ready: { label: "Siap", tone: "success" },
  failed: { label: "Gagal", tone: "destructive" },
  rejected: { label: "Ditolak", tone: "muted" },
};

export const LEVEL_LABELS: Record<string, string> = {
  low: "Perlu pendampingan penuh",
  medium: "Perlu bimbingan ringan",
  high: "Mandiri",
};

export const INTERACTION_LABELS: Record<string, string> = {
  touch: "Sentuh pilihan besar",
  speech: "Ucapkan jawaban",
  keyboard: "Ketik jawaban",
  switch: "Sakelar tunggal",
  drag: "Susun gambar",
};

export const NAV_STYLE_LABELS: Record<string, string> = {
  step: "Langkah demi langkah",
  scroll: "Gulir bebas",
  tap: "Ketuk halaman",
};

export const CONTRAST_LABELS: Record<string, string> = {
  normal: "Kontras biasa",
  high: "Kontras tinggi",
};

export const AUDIO_SPEED_LABELS: Record<string, string> = {
  slow: "Lambat (0.7x)",
  normal: "Normal (1.0x)",
  fast: "Cepat (1.25x)",
};

export const AUDIO_SPEED_VALUE: Record<string, number> = {
  slow: 0.7,
  normal: 1,
  fast: 1.25,
};