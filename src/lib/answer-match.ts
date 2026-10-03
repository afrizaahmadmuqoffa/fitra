/**
 * Pencocokan jawaban siswa yang berasal dari suara atau ketikan.
 *
 * Speech-to-Text rarely returns text identical to the answer key. A student
 * who answers "5" for a key of "lima", or says "menghitung benda" when the key
 * is "menghitung jumlah benda", must not be marked wrong for phrasing alone.
 *
 * This module is intentionally pure: no DOM, no browser API. The same function
 * can be reused later when a Server Action writes the answer to
 * progress_records.
 */

/** Digit form to Indonesian number words, for values a class 1-6 student hears. */
const ANGKA_KE_KATA: Record<string, string> = {
  "0": "nol",
  "1": "satu",
  "2": "dua",
  "3": "tiga",
  "4": "empat",
  "5": "lima",
  "6": "enam",
  "7": "tujuh",
  "8": "delapan",
  "9": "sembilan",
  "10": "sepuluh",
  "11": "sebelas",
  "12": "dua belas",
  "13": "tiga belas",
  "14": "empat belas",
  "15": "lima belas",
  "16": "enam belas",
  "17": "tujuh belas",
  "18": "delapan belas",
  "19": "sembilan belas",
  "20": "dua puluh",
};

/** "pertama" and friends resolve to the cardinal so "pertama" matches "satu". */
const URUTAN_KE_KATA: Record<string, string> = {
  pertama: "satu",
  kedua: "dua",
  ketiga: "tiga",
  keempat: "empat",
  kelima: "lima",
  keenam: "enam",
  ketujuh: "tujuh",
  kedelapan: "delapan",
  kesembilan: "sembilan",
  kesepuluh: "sepuluh",
};

/**
 * Filler words that carry no meaning when judging an answer. Removed before
 * scoring so they cannot dilute the overlap.
 */
const KATA_SANDUNG = new Set([
  "yang",
  "untuk",
  "dengan",
  "di",
  "ke",
  "dari",
  "pada",
  "itu",
  "ini",
  "adalah",
  "ya",
  "yaitu",
  "saja",
  "dong",
  "sih",
  "kah",
  "pun",
  "tolong",
  "coba",
  "saya",
  "jawab",
  "adakah",
  "maka",
  "silakan",
]);

/**
 * Imperson-free prefixes common in Indonesian action verbs.
 *
 * A student asked to "menghitung jumlah benda" commonly answers "hitung
 * benda", so "menghitung" and "hitung" must score as the same word. Stripping
 * is deliberately conservative: once per token, and only while at least four
 * characters remain, so ordinary words such as "dia" or "makan" survive.
 */
const AWALAN_VERB = [
  "meng",
  "meny",
  "mem",
  "men",
  "peng",
  "peny",
  "pem",
  "pen",
  "ber",
  "per",
  "ter",
];

function buangAwalanVerb(word: string): string {
  for (const awalan of AWALAN_VERB) {
    if (!word.startsWith(awalan)) continue;
    const sisa = word.slice(awalan.length);
    if (sisa.length >= 4) return sisa;
  }
  return word;
}

/**
 * Whether two words count as the same idea.
 *
 * Prefix stripping is not always enough: "menulis" reduces to "ulis" while
 * "tulis" stays whole. Treating a short leftover as compatible with the longer
 * original lets those pair up, while the minimum length guard keeps unrelated
 * short words such as "di" and "dua" apart.
 */
function kataSepadan(a: string, b: string): boolean {
  if (a === b) return true;
  const [pendek, panjang] = a.length <= b.length ? [a, b] : [b, a];
  if (pendek.length < 4) return false;
  return panjang.startsWith(pendek) && panjang.length - pendek.length <= 3;
}

/** Recogniser noise that trails a word, e.g. "limanya" or "lima-lah". */
function buangAkhiran(word: string): string {
  return word.replace(/(?:nya|lah|kok)$/, "");
}

/** "kelima" becomes "lima", but "keluarga" stays "keluarga". */
function buangAwalanKe(word: string): string {
  if (!word.startsWith("ke") || word.length <= 3) return word;
  const sisa = word.slice(2);
  if (URUTAN_KE_KATA[word]) return URUTAN_KE_KATA[word];
  return ANGKA_KE_KATA[sisa] ? sisa : word;
}

/** Lowercase and remove punctuation, keeping digits and letters. */
function buangTandaBaca(value: string): string {
  return value
    .toLowerCase()
    .replace(/[.,!?;:"'`()[\]{}<>/\\|_+*&#%^~=-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Replace standalone digit runs with their Indonesian words. */
function gantiAngka(value: string): string {
  return value.replace(/\b(\d{1,2})\b/g, (digit) => ANGKA_KE_KATA[digit] ?? digit);
}

/**
 * Normalizes raw text into comparable number words.
 *
 * "5", "Lima", "kelima", and "lima." all become "lima".
 */
export function normalisasiJawaban(value: string): string {
  const dasar = buangTandaBaca(value);
  if (!dasar) return "";
  return gantiAngka(dasar);
}

/** Meaningful tokens for scoring: normalized, no filler, no ordinal noise. */
function tokenisasi(value: string): string[] {
  return normalisasiJawaban(value)
    .split(" ")
    .map((word) => buangAkhiran(buangAwalanKe(word)))
    .map((word) => buangAwalanVerb(word))
    .filter((word) => word.length > 0 && !KATA_SANDUNG.has(word));
}

/**
 * Blended similarity between 0 and 1.
 *
 * Coverage (overlap divided by the shorter phrase) carries the decision so a
 * partial phrase is not punished for being short. Jaccard is blended in to stop
 * a single shared word from matching a much longer answer key.
 */
export function skorKemiripan(siya: string, kunci: string): number {
  const a = new Set(tokenisasi(siya));
  const b = new Set(tokenisasi(kunci));
  if (a.size === 0 || b.size === 0) return 0;

  let overlap = 0;
  for (const word of a) {
    for (const lain of b) {
      if (kataSepadan(word, lain)) {
        overlap += 1;
        break;
      }
    }
  }
  if (overlap === 0) return 0;

  // A one-word answer always covers itself completely, which would let
  // "benda" pass against "hitung jumlah benda warna". Require the answer to
  // reach a fair share of the key as well, unless the key is itself short.
  const cakupanKunci = overlap / b.size;
  if (cakupanKunci < 0.5 && b.size > 2) return 0;

  const cakupanJawaban = overlap / a.size;
  const jaccard = overlap / (a.size + b.size - overlap);
  return cakupanJawaban * 0.7 + jaccard * 0.3;
}

/** Minimum score accepted as a correct answer. */
const AMBANG_TEPAT = 0.6;
/** Scores in this range still deserve a confirmation prompt. */
const AMBANG_HAMPIR_BENAR = 0.4;

export type HasilCocok = {
  benar: boolean;
  /** Near miss worth confirming with the student before scoring it wrong. */
  hampirBenar: boolean;
  /** Highest score reached, kept for deciding what to confirm. */
  skor: number;
  /** Answer key closest to what the student said. */
  kunciTerdekat: string | null;
};

function tanpaHasil(): HasilCocok {
  return { benar: false, hampirBenar: false, skor: 0, kunciTerdekat: null };
}

/**
 * Judges a student answer against the accepted answer keys.
 *
 * "5" matches "lima" through normalization. "menghitung benda" matches
 * "menghitung jumlah benda" because coverage reaches 1.0 while the blended
 * score stays at 0.9. An unrelated word such as "kucing" scores 0.
 */
export function cocokkanJawaban(jawaban: string, kunciJawaban: string[]): HasilCocok {
  if (!kunciJawaban.length) return tanpaHasil();
  if (!jawaban.trim()) return tanpaHasil();

  let skorTertinggi = 0;
  let kunciTerdekat: string | null = null;

  for (const kunci of kunciJawaban) {
    if (!normalisasiJawaban(kunci)) continue;

    if (normalisasiJawaban(jawaban) === normalisasiJawaban(kunci)) {
      return { benar: true, hampirBenar: false, skor: 1, kunciTerdekat: kunci };
    }

    const skor = skorKemiripan(jawaban, kunci);
    if (skor > skorTertinggi) {
      skorTertinggi = skor;
      kunciTerdekat = kunci;
    }
  }

  if (skorTertinggi >= AMBANG_TEPAT) {
    return {
      benar: true,
      hampirBenar: false,
      skor: skorTertinggi,
      kunciTerdekat,
    };
  }

  return {
    benar: false,
    hampirBenar: skorTertinggi >= AMBANG_HAMPIR_BENAR,
    skor: skorTertinggi,
    kunciTerdekat,
  };
}
