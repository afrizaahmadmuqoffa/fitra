/**
 * Langkah 0 — verifikasi ekstraksi PDF lewat unpdf.
 *
 * PDF uji dibuat langsung di sini supaya tidak perlu berkas contoh dari luar.
 * Isinya teks Indonesia sungguhan, lalu diekstrak dan diperiksa.
 *
 * Jalankan: npx tsx scripts/cek-pdf-ekstrak.ts
 */
import { writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** Bangun PDF sederhana dengan offset xref yang benar. */
function buatPdf(halaman: string[][]): Buffer {
  const objek: string[] = [];

  objek.push("<< /Type /Catalog /Pages 2 0 R >>");

  const kids = halaman
    .map((_, index) => `${3 + index * 3} 0 R`)
    .join(" ");
  objek.push(`<< /Type /Pages /Kids [${kids}] /Count ${halaman.length} >>`);

  halaman.forEach((baris, index) => {
    // Setiap halaman mendorong tiga objek: page, content, font. Karena itu
    // nomor objek melompat tiga, bukan dua.
    const nomorIsi = 4 + index * 3;
    const nomorFont = 5 + index * 3;
    objek.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${nomorIsi} 0 R /Resources << /Font << /F1 ${nomorFont} 0 R >> >> >>`,
    );

    let streams = "BT\n/F1 16 Tf\n72 720 Td\n18 TL\n";
    for (const item of baris) {
      const aman = item.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
      streams += `(${aman}) Tj T*\n`;
    }
    streams += "ET";

    objek.push(
      `<< /Length ${Buffer.byteLength(streams, "latin1")} >>\nstream\n${streams}\nendstream`,
    );
    objek.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  });

  let isi = "%PDF-1.4\n";
  const offset: number[] = [];

  objek.forEach((teks, index) => {
    offset.push(Buffer.byteLength(isi, "latin1"));
    isi += `${index + 1} 0 obj\n${teks}\nendobj\n`;
  });

  const mulaiXref = Buffer.byteLength(isi, "latin1");
  isi += `xref\n0 ${objek.length + 1}\n0000000000 65535 f \n`;
  for (const nilai of offset) {
    isi += `${String(nilai).padStart(10, "0")} 00000 n \n`;
  }
  isi += `trailer\n<< /Size ${objek.length + 1} /Root 1 0 R >>\nstartxref\n${mulaiXref}\n%%EOF\n`;

  return Buffer.from(isi, "latin1");
}

async function main() {
  const halaman = [
    [
      "Bagian Tumbuhan",
      "Akar menyerap air dari tanah.",
      "Batang menyokong tumbuhan.",
    ],
    [
      "Bagian Daun",
      "Daun menangkap cahaya matahari.",
      "Tumbuhan membuat zat makanan.",
    ],
  ];

  const pdf = buatPdf(halaman);
  const jalur = join(tmpdir(), "fitra-uji-ekstrak.pdf");
  writeFileSync(jalur, pdf);
  console.log("PDF uji: " + pdf.byteLength + " byte, " + halaman.length + " halaman");

  let gagal = 0;

  try {
    const { extractText, getDocumentProxy } = await import("unpdf");

    const proxy = await getDocumentProxy(new Uint8Array(pdf));
    const hasil = await extractText(proxy, { mergePages: true });

    console.log("totalPages: " + hasil.totalPages);
    const teks: string = hasil.text;
    console.log("--- teks hasil ekstraksi ---");
    console.log(teks);
    console.log("--- akhir ---");

    if (hasil.totalPages !== 2) {
      console.log("GAGAL  jumlah halaman tidak sesuai");
      gagal += 1;
    } else {
      console.log("LOLOS  jumlah halaman benar");
    }

    for (const Calibration of asumsiModul) {
      if (teks.includes(Calibration)) {
        console.log("LOLOS  ada: " + Calibration);
      } else {
        console.log("GAGAL  hilang: " + Calibration);
        gagal += 1;
      }
    }
  } catch (error) {
    gagal += 1;
    console.log(
      "GAGAL  ekstraksi melempar galat: " +
        (error instanceof Error ? error.message : String(error)),
    );
  } finally {
    rmSync(jalur, { force: true });
    console.log("BERSIH  berkas uji dihapus");
  }

  console.log(gagal === 0 ? "\nEKSTRAKSI PDF LOLOS" : `\n${gagal} MASALAH`);
  process.exit(gagal === 0 ? 0 : 1);
}

const asumsiModul = [
  "Bagian Tumbuhan",
  "Akar menyerap air dari tanah.",
  "Batang menyokong tumbuhan.",
  "Bagian Daun",
  "Daun menangkap cahaya matahari.",
  "Tumbuhan membuat zat makanan.",
];

void main();
