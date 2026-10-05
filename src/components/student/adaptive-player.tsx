"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { AUDIO_SPEED_VALUE } from "@/lib/constants";
import { cocokkanJawaban } from "@/lib/answer-match";
import {
  completeLearningSessionAction,
  recordProgressAction,
  startLearningSessionAction,
} from "@/actions/student";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  X,
} from "lucide-react";
import { DragInteraction } from "./drag-interaction";
import type {
  AdaptedInteraction,
  AdaptedSection,
  VisualAsset,
} from "@/lib/dummy/types";
import type { AudioSpeed, NavStyle, SkillLevel } from "@/lib/dummy/types";

export type PlayerUiTokens = {
  fontSize: SkillLevel;
  contrastMode: "normal" | "high";
  audioEnabled: boolean;
  audioSpeed: AudioSpeed;
  navStyle: NavStyle;
};

export type PlayerModes = {
  touch: boolean;
  speech: boolean;
  keyboard: boolean;
  switch: boolean;
  drag: boolean;
};

const TAP = "min-h-[var(--spacing-student-tap)]";
/**
 * Kecepatan cadangan ketika peramban tidak memberi tahu posisi kata.
 *
 * Sengaja lebih lambat daripada laju bicara normal. Kalau cadangan terlalu
 * cepat, sorotan mendahului suara dan siswa membaca kata yang belum
 * diucapkan. Tertinggal sedikit jauh lebih ringan daripada melompat
 * bolak-balik.
 */
const WORDS_PER_SECOND = 1.9;
/**
 * Berapa lama menunggu event batas kata sebelum menganggap peramban ini
 * sama sekali tidak mengirimkannya. Batas pertama biasanya datang di bawah
 * 300 ms, jadi 600 ms cukup untuk memutuskan tanpa menahan lama di telepon.
 */
const JEDA_BOUNDARY_MS = 600;
/** Spoken ordinals so audio can be matched to the option buttons on screen. */
const KATA_PENANDA = ["pertama", "kedua", "ketiga", "keempat", "kelima"];

type Answer = { response: string; correct: boolean };

/**
 * Which script is currently being spoken, so the highlight follows the audio
 * instead of always pointing at the material body.
 */
type Naskah = "materi" | "soal";

function nomorUrut(n: number): string {
  return KATA_PENANDA[n] ?? `ke-${n + 1}`;
}

/**
 * Waktu berjalan untuk menghitung durasi belajar.
 *
 * Dipisah ke luar komponen supaya pemanggilnya tidak terlihat sebagai bagian
 * dari render, yang tidak boleh menjalankan fungsi murni.
 */
function waktuSekarang(): number {
  return performance.now();
}

/** Material title plus body lines, joined as one speakable script. */
function naskahMateri(section: AdaptedSection | undefined): string {
  if (!section) return "";
  return [section.title, ...section.body].filter(Boolean).join(". ").trim();
}

/**
 * Question plus numbered options.
 *
 * Numbering matters: without it a student hears "lima" and "enam" with no way
 * to tell which button each belongs to.
 */
function naskahSoal(interaction: AdaptedInteraction | null): string {
  if (!interaction) return "";
  const opsi = interaction.options
    .map((option, position) => `Pilihan ${nomorUrut(position)}, ${option.label}`)
    .join(". ");
  // A trailing "?" followed by a period would read as a sentence break with a
  // doubled punctuation mark, so the joiner is a space.
  return [interaction.prompt, opsi].filter(Boolean).join(" ");
}

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

function getRecognition(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

export function AdaptivePlayer({
  studentName,
  materialTitle,
  subject,
  sections,
  assets,
  uiTokens,
  modes,
  token,
  adaptationId,
  listHref,
  doneHref,
}: {
  studentName: string;
  materialTitle: string;
  subject: string;
  sections: AdaptedSection[];
  assets: VisualAsset[];
  uiTokens: PlayerUiTokens;
  modes: PlayerModes;
  /** Token QR yang sedang dipakai; dipakai untuk mencatat progres. */
  token: string;
  /** Id adaptasi yang sedang dibuka. */
  adaptationId: string;
  listHref: string;
  doneHref: string;
}) {
  const router = useRouter();
  const [index, setIndex] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const [paused, setPaused] = React.useState(false);
  const [naskah, setNaskah] = React.useState<Naskah>("materi");
  const [wordIndex, setWordIndex] = React.useState(0);
  const [speed, setSpeed] = React.useState(AUDIO_SPEED_VALUE[uiTokens.audioSpeed]);
  const [answers, setAnswers] = React.useState<Record<number, Answer>>({});
  const [typed, setTyped] = React.useState("");
  const [heard, setHeard] = React.useState("");
  const [listening, setListening] = React.useState(false);
  const [perluKonfirmasi, setPerluKonfirmasi] = React.useState<{
    jawaban: string;
    kunci: string;
  } | null>(null);

  const [scanEnabled, setScanEnabled] = React.useState(false);
  const [scanIndex, setScanIndex] = React.useState(0);

  /**
   * Lacakan sinkronisasi sorotan dengan suara.
   *
   * Tiga hal disimpan di ref, bukan state, karena semuanya hanya dibaca di
   * dalam loop timer dan tidak boleh memicu render ulang.
   *
* `modeBoundary` bernilai true kalau peramban ternyata mengirim batas
   * kata. Selama nilainya true, timer berhenti sepenuhnya dan sorotan
   * hanya mengikuti suara.
   * `batasTerakhir` menyimpan waktu event batas terakhir, dipakai menghitung
   * apakah peramban diam atau masih mengirim.
   * `mulaiSuara` menyimpan waktu audio mulai, jadi posisi cadangan dihitung
   * dari waktu berjalan, bukan dari jumlah tick.
   */
  const modeBoundary = React.useRef(false);
  const batasTerakhir = React.useRef(0);
  const mulaiSuara = React.useRef(0);

  // Pencatatan sesi belajar (PRD 6.F dan 3.5). Sesi dibuka sekali saat materi
  // dibuka, setiap jawaban dicatat per bagian, lalu sesi ditutup saat siswa
  // selesai. Kegagalan pencatatan tidak boleh mengganggu belajar, jadi
  // hasilnya hanya dipakai untuk bookkeeping.
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const mulaiSesiRef = React.useRef<number>(0);
  const masukBagianRef = React.useRef<Record<number, number>>({});

  const section = sections[index];
  const interaction = section?.interactions[0] ?? null;
  const scriptMateri = React.useMemo(() => naskahMateri(section), [section]);
  const scriptSoal = React.useMemo(
    () => naskahSoal(interaction),
    [interaction],
  );
  const teksNaskah = naskah === "soal" ? scriptSoal : scriptMateri;
  const words = React.useMemo(
    () => teksNaskah.split(/\s+/).filter(Boolean),
    [teksNaskah],
  );
  const answered = answers[index];

  /**
   * speechSynthesis is read on demand rather than cached in state: detecting it
   * after mount would need a state write inside an effect, and the value is
   * constant for the life of the page anyway.
   */
  const bisaSuara = typeof window !== "undefined" && "speechSynthesis" in window;

  /**
   * Maps a speech boundary charIndex to the index of the word being spoken.
   *
   * charIndex points at the start of the current word, so the count of complete
   * words before it is exactly that word's index. Subtracting one would land the
   * highlight on the previous word.
   */
  function posisiDariCharIndex(script: string, charIndex: number): number {
    const selesai = script
      .slice(0, charIndex)
      .split(/\s+/)
      .filter(Boolean).length;
    const total = script.split(/\s+/).filter(Boolean).length;
    return Math.min(Math.max(selesai, 0), Math.max(total - 1, 0));
  }

  /** Hentikan audio dan kembalikan sorotan ke awal tanpa mengubah jawaban. */
  function stopSpeaking() {
    if (bisaSuara) {
      window.speechSynthesis.cancel();
    }
    setPlaying(false);
    setPaused(false);
    setWordIndex(0);
    modeBoundary.current = false;
    mulaiSuara.current = 0;
  }

  /**
   * Membacakan naskah dan menyorot kata yang sedang diucapkan.
   *
   * Dua sumber posisi kata dipakai bergantian, bukan berebut:
   *
   * Event batas kata adalah sumber yang benar. Begitu peramban mengirim
   * satu saja, `modeBoundary` menyala dan timer langsung angkat tangan,
   * sehingga sorotan tidak pernah mendahului suara lalu melompat ke
   * belakang saat event berikutnya tiba.
   *
   * Timer hanya bekerja sebagai cadangan, untuk peramban yang memang tidak
   * pernah mengirim batas kata seperti Google TTS di Android. Ia menunggu
   * masa tenggang lebih dulu supaya peramban yang lambat tidak kelihatan
   * memakai timer sejak awal.
   */
  function speak(target: Naskah) {
    const script = target === "soal" ? scriptSoal : scriptMateri;
    if (!script) return;

    setNaskah(target);
    setWordIndex(0);
    setPlaying(true);
    setPaused(false);
    modeBoundary.current = false;
    mulaiSuara.current = performance.now();
    batasTerakhir.current = performance.now();

    if (!bisaSuara) {
      return;
    }

    const synth = window.speechSynthesis;
    synth.cancel();

    const utter = new SpeechSynthesisUtterance(script);
    utter.lang = "id-ID";
    utter.rate = speed;

    utter.onboundary = (event) => {
      // Batas kalimat terlalu kasar untuk disorot, jadi diabaikan.
      if (event.name === "sentence") return;
      // Sebagian mesin TTS di telepon mengirim batas kata dengan `name`
      // yang kosong atau tidak ada sama sekali. Menolak event seperti itu
      // membuat sorotan di Android tidak pernah bergerak sama sekali.
      if (event.name && event.name !== "word") return;
      if (typeof event.charIndex !== "number") return;

      modeBoundary.current = true;
      batasTerakhir.current = performance.now();
      setWordIndex(posisiDariCharIndex(script, event.charIndex));
    };
    utter.onend = () => {
      modeBoundary.current = false;
      mulaiSuara.current = 0;
      setPlaying(false);
      setPaused(false);
      setWordIndex(0);
    };
    utter.onerror = () => {
      modeBoundary.current = false;
      mulaiSuara.current = 0;
      setPlaying(false);
      setPaused(false);
    };

    synth.speak(utter);
  }

  /** Re-read the current script from the beginning at the chosen speed. */
  function repeatCurrent() {
    speak(naskah);
  }

  /**
   * Mulai, jeda, atau lanjutkan sesuai keadaan sekarang.
   *
   * Tanpa dukungan speechSynthesis, tombol ini hanya menggerakkan sorotan
   * lewat timer cadangan supaya tetap ada yang terlihat bergerak.
   */
  function togglePlay() {
    if (!bisaSuara) {
      setNaskah("materi");
      if (!playing) {
        // Timer cadangan mengukur posisi dari waktu mulai, jadi waktu awal
        // harus diisi di sini juga. Tanpa ini sorotan langsung meloncat ke
        // kata terakhir.
        mulaiSuara.current = performance.now();
        batasTerakhir.current = performance.now();
        setWordIndex(0);
      }
      setPlaying(!playing);
      return;
    }

    const synth = window.speechSynthesis;
    if (playing && !paused) {
      synth.pause();
      setPaused(true);
      return;
    }
    if (playing && paused) {
      synth.resume();
      setPaused(false);
      return;
    }
    speak("materi");
  }

  function repeatQuestion() {
    speak("soal");
  }

  /** Changing speed mid-sentence restarts the script at the new pace. */
  function ubahKecepatan(value: number) {
    setSpeed(value);
    if (!playing) return;
    speak(naskah);
  }

  /**
   * Cadangan penyorotan kata untuk peramban tanpa event batas kata.
   *
   * Loop ini hanya berjalan kalau dua syarat sama-sama terpenuhi:
   * peramban belum pernah mengirim batas kata, dan masa tenggang sudah
   * lewat tanpa batas baru. Selama peramban masih mengirim batas kata,
   * loop ini membaca ref lalu keluar tanpa mengubah apa pun.
   *
   * Posisi dihitung dari waktu berjalan, bukan menambah satu kata per tick.
   * Kalau tick telat karena tab sedang berat, posisi tetap benar pada tick
   * berikutnya. Versi lama menambah satu kata per tick sehingga galat
   * menumpuk dan sorotan terus mendahului suara, lalu meloncat ke
   * belakang saat event batas akhirnya tiba.
   */
  React.useEffect(() => {
    if (!playing || paused || !uiTokens.audioEnabled) return;

    const totalKata = Math.max(words.length, 1);
    const tick = window.setInterval(() => {
      if (modeBoundary.current) return;
      if (performance.now() - batasTerakhir.current < JEDA_BOUNDARY_MS) return;

      const durasi =
        ((totalKata - 1) / (WORDS_PER_SECOND * speed)) * 1000;
      const posisi =
        durasi > 0
          ? Math.floor(
              ((performance.now() - mulaiSuara.current) / durasi) *
                (totalKata - 1),
            )
          : 0;

      // Ditahan di kata terakhir sampai `onend` datang, jangan dibungkus
      // ke kata pertama karena itu terlihat seperti suara diulang dari
      // awal.
      setWordIndex(Math.min(posisi, totalKata - 1));
    }, 100);

    return () => window.clearInterval(tick);
  }, [
    playing,
    paused,
    speed,
    words.length,
    uiTokens.audioEnabled,
  ]);

  // Never leave audio running when leaving the page.
  React.useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Auto-scan options when switch mode enabled.
  React.useEffect(() => {
    if (!scanEnabled || !interaction) return;
    if (answered) return;

    const interval = window.setInterval(() => {
      setScanIndex(
        (current) => (current + 1) % interaction.options.length
      );
    }, 2000);

    return () => window.clearInterval(interval);
  }, [scanEnabled, interaction, answered]);

  // Buka sesi belajar sekali saat materi dibuka (PRD 6.F).
  React.useEffect(() => {
    let batal = false;
    mulaiSesiRef.current = waktuSekarang();

    void (async () => {
      try {
        const hasil = await startLearningSessionAction({ token, adaptationId });
        if (batal) return;
        if (hasil.ok && hasil.sessionId) {
          setSessionId(hasil.sessionId);
        }
      } catch {
        // Pencatatan gagal tidak boleh menghentikan belajar.
      }
    })();

    return () => {
      batal = true;
    };
  }, [token, adaptationId]);

  function goToSection(next: number) {
    stopSpeaking();
    setIndex(next);
    setTyped("");
    setHeard("");
    setPerluKonfirmasi(null);
    masukBagianRef.current[next] = waktuSekarang();
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  /** Catat satu jawaban ke progress_records tanpa mengganggu layar. */
  function catatJawaban(
    sectionIndex: number,
    interactionType: string,
    response: string,
    correct: boolean,
  ) {
    if (!sessionId) return;
    const masuk = masukBagianRef.current[sectionIndex] ?? waktuSekarang();
    void recordProgressAction({
      token,
      sessionId,
      sectionIndex,
      interactionType,
      response,
      isCorrect: correct,
      timeSpentSeconds: Math.max(
        0,
        Math.round((waktuSekarang() - masuk) / 1000),
      ),
    }).catch(() => {
      // Sengaja diabaikan: siswa tidak boleh gagal belajar karena log tidak
      // tersimpan.
    });
  }

  function submitAnswer(
    response: string,
    correct: boolean,
    interactionType: "touch" | "speech" | "text" | "drag" = "touch",
  ) {
    if (answered) return;
    setPerluKonfirmasi(null);
    setAnswers((current) => ({ ...current, [index]: { response, correct } }));
    catatJawaban(index, interactionType, response, correct);
    stopSpeaking();
  }

  /**
   * Dengarkan aktivasi sakelar lewat Spasi atau Enter, dan Escape untuk
   * menghentikan pemindaian.
   *
   * Efek ini sengaja diletakkan setelah deklarasi `submitAnswer` di atas.
   * Fungsi biasa di dalam komponen otomatis terangkat ke atas sehingga
   * urutan deklarasi tidak masalah, tetapi aturan React Hooks tetap menolak
   * rujukan ke fungsi yang belum dideklarasikan pada baris di atas.
   */
  React.useEffect(() => {
    if (!scanEnabled || !interaction || answered) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.code === "Space" || event.code === "Enter") {
        event.preventDefault();
        const option = interaction.options[scanIndex];
        if (option) {
          submitAnswer(option.label, option.correct);
          setScanEnabled(false);
        }
      }
      if (event.code === "Escape") {
        event.preventDefault();
        setScanEnabled(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanEnabled, interaction, scanIndex, answered]);

  /**
   * Judges a spoken or typed answer.
   *
   * A near miss asks for confirmation instead of scoring straight away, so a
   * student who speaks imperfectly gets one more try before the answer is
   * recorded as wrong.
   */
  function nilaiJawaban(jawaban: string, asal: "suara" | "ketik") {
    if (!interaction) return;
    const teks = jawaban.trim();
    const cadangan = asal === "suara" ? "jawaban suara" : "jawaban ketik";
    const hasil = cocokkanJawaban(teks, interaction.acceptedAnswers);

    if (hasil.benar) {
      submitAnswer(teks || cadangan, true, asal === "suara" ? "speech" : "text");
      return;
    }

    if (hasil.hampirBenar && hasil.kunciTerdekat) {
      setPerluKonfirmasi({ jawaban: teks || cadangan, kunci: hasil.kunciTerdekat });
      return;
    }

    submitAnswer(teks || cadangan, false, asal === "suara" ? "speech" : "text");
  }

  function konfirmasiBenar() {
    if (!perluKonfirmasi) return;
    submitAnswer(perluKonfirmasi.jawaban, true, "speech");
  }

  function konfirmasiUlangi() {
    setPerluKonfirmasi(null);
    setHeard("");
    setTyped("");
  }

  function startListening() {
    const recognition = getRecognition();
    if (!recognition) {
      setListening(true);
      window.setTimeout(() => {
        setListening(false);
        setHeard(interaction?.acceptedAnswers[0] ?? "");
      }, 1200);
      return;
    }
    try {
      recognition.lang = "id-ID";
      recognition.interimResults = false;
      recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript ?? "";
        setHeard(transcript);
        setListening(false);
      };
      recognition.onend = () => setListening(false);
      recognition.onerror = () => setListening(false);
      recognition.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }

  function submitSpeech() {
    if (!interaction) return;
    nilaiJawaban(heard, "suara");
  }

  function submitTyped() {
    if (!interaction) return;
    nilaiJawaban(typed, "ketik");
  }

  const correctCount = Object.values(answers).filter((item) => item.correct).length;
  const isLast = index === sections.length - 1;

  function finish() {
    const total = sections.filter((item) => item.interactions.length > 0).length;

    // Tutup sesi sebelum pindah halaman supaya durasi benar-benar tersimpan.
    if (sessionId) {
      const durasi = Math.max(
        1,
        Math.round((waktuSekarang() - mulaiSesiRef.current) / 1000),
      );
      void completeLearningSessionAction({
        token,
        sessionId,
        durationSeconds: durasi,
      }).catch(() => {
        // Layarifinal tetap dibuka walau pencatatan gagal.
      });
    }

    router.push(
      `${doneHref}?benar=${correctCount}&dijawab=${Object.keys(answers).length}&total=${total}`,
    );
  }

  function renderSection(item: AdaptedSection, itemIndex: number) {
    const itemAsset = assets.find((entry) => entry.sectionIndex === itemIndex) ?? null;
    const itemInteraction = item.interactions[0] ?? null;
    const itemAnswer = answers[itemIndex];
    const isActive = itemIndex === index;

    return (
      <Card
        key={itemIndex}
        className={cn(
          "border-2",
          isActive ? "border-primary/40" : "border-border",
        )}
      >
        <CardContent className="space-y-4 py-5">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Bagian {itemIndex + 1}</Badge>
            {itemAnswer ? (
              <Badge variant={itemAnswer.correct ? "default" : "outline"}>
                {itemAnswer.correct ? "Benar" : "Belum tepat"}
              </Badge>
            ) : null}
          </div>

          <h2 className="font-heading text-xl font-bold">{item.title}</h2>

          {itemAsset?.imageUrl ? (
            <div
              role="img"
              aria-label={item.media[0]?.altText ?? "Ilustrasi materi"}
              style={{ backgroundImage: `url(${itemAsset.imageUrl})` }}
              className="h-52 rounded-xl border bg-muted/60 bg-cover bg-center"
            />
          ) : null}

          {item.body.map((line, lineIndex) => (
            <p key={lineIndex} className="text-lg leading-relaxed">
              {line}
            </p>
          ))}

          {itemInteraction ? (
            <div className="space-y-3 rounded-xl bg-muted/50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-lg font-semibold">{itemInteraction.prompt}</p>
                {uiTokens.audioEnabled && isActive ? (
                  <Button
                    variant="outline"
                    size="lg"
                    className={cn(TAP, "shrink-0")}
                    onClick={() => {
                      setIndex(itemIndex);
                      repeatQuestion();
                    }}
                  >
                    <Volume2 className="size-5" aria-hidden="true" />
                    Ulangi soal
                  </Button>
                ) : null}
              </div>

              {itemInteraction.kind === "drag" && !itemAnswer ? (
                <DragInteraction
                  interaction={itemInteraction}
                  onSubmit={(answer, correct) =>
                    submitAnswer(answer, correct, "drag")
                  }
                  tapClassName={TAP}
                />
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {itemInteraction.options.map((option) => (
                    <Button
                      key={option.id}
                      size="lg"
                      className={TAP}
                      variant={
                        itemAnswer
                          ? option.correct
                            ? "default"
                            : "outline"
                          : "outline"
                      }
                      disabled={Boolean(itemAnswer)}
                      onClick={() => submitAnswer(option.label, option.correct)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              )}

              {itemAnswer ? (
                <p
                  className={cn(
                    "flex items-center gap-2 text-base font-medium",
                    itemAnswer.correct ? "text-success" : "text-warning-foreground",
                  )}
                >
                  {itemAnswer.correct ? (
                    <Check className="size-5" aria-hidden="true" />
                  ) : (
                    <X className="size-5" aria-hidden="true" />
                  )}
                  {itemAnswer.correct
                    ? "Bagus sekali, jawabanmu tepat."
                    : "Belum tepat. Lihat kembali bagian atas halaman."}
                </p>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 px-3 py-5">
      <div>
        <p className="text-sm text-muted-foreground">
          {subject} - {studentName}
        </p>
        <h1 className="font-heading text-2xl font-bold">{materialTitle}</h1>
      </div>

      <Progress
        value={((index + 1) / sections.length) * 100}
        className="h-2"
        indicatorClassName="bg-primary"
        aria-label="Kemajuan materi"
      />

      {uiTokens.navStyle === "scroll" ? (
        <div className="space-y-3">
          {sections.map((item, itemIndex) => renderSection(item, itemIndex))}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="lg" className={TAP} asChild>
              <Link href={listHref}>
                <ArrowLeft className="size-5" aria-hidden="true" />
                Daftar materi
              </Link>
            </Button>
            <Button size="lg" className={TAP} onClick={finish}>
              Selesai belajar
              <Check className="size-5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {uiTokens.navStyle === "tap"
              ? sections.map((item, itemIndex) => (
                  <button
                    key={itemIndex}
                    type="button"
                    onClick={() => goToSection(itemIndex)}
                    aria-pressed={itemIndex === index}
                    className={cn(
                      "w-full rounded-lg border-2 p-3 text-left text-sm font-medium transition-colors",
                      itemIndex === index
                        ? "border-primary bg-accent/50"
                        : "border-border",
                    )}
                  >
                    {itemIndex + 1}. {item.title}
                  </button>
                ))
              : null}

            {renderSection(section, index)}
          </div>

          {uiTokens.audioEnabled ? (
            <Card className="border-border/80 bg-muted/50">
              <CardContent className="space-y-4 py-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="lg" className={TAP} onClick={togglePlay}>
                    {playing && !paused ? (
                      <Pause className="size-6" aria-hidden="true" />
                    ) : (
                      <Play className="size-6" aria-hidden="true" />
                    )}
                    {playing && !paused ? "Jeda" : "Dengarkan"}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className={TAP}
                    onClick={repeatCurrent}
                  >
                    <RotateCcw className="size-5" aria-hidden="true" />
                    Ulangi
                  </Button>
                  {!bisaSuara ? (
                    <p className="w-full text-xs text-muted-foreground">
                      Peramban ini belum mendukung pembacaan suara, jadi hanya sorotan
                      kata yang bergerak.
                    </p>
                  ) : null}
                </div>

                <div className="rounded-xl bg-background p-4">
                  <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Volume2 className="size-4" aria-hidden="true" />
                    {naskah === "soal"
                      ? "Naskah soal yang sedang dibacakan"
                      : "Naskah yang sedang dibacakan"}
                  </p>
                  <p className="mt-2 text-lg leading-relaxed">
                    {words.map((word, wordPosition) => (
                      <span
                        key={`${word}-${wordPosition}`}
                        className={cn(
                          "rounded px-0.5 transition-colors",
                          playing &&
                            wordPosition === wordIndex &&
                            "bg-primary text-primary-foreground",
                        )}
                      >
                        {word}{" "}
                      </span>
                    ))}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Kecepatan suara</span>
                    <span className="font-medium tabular-nums">{speed.toFixed(2)}x</span>
                  </div>
                  <Slider
                    min={0.5}
                    max={1.5}
                    step={0.05}
                    value={[speed]}
                    onValueChange={(value) => ubahKecepatan(value[0] ?? 1)}
                    aria-label="Kecepatan pembacaan suara"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Lambat</span>
                    <span>Normal</span>
                    <span>Cepat</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {interaction && !answered ? (
            <Card className="border-border/80">
              <CardContent className="space-y-3 py-5">
                <p className="text-base font-semibold">Cara menjawab</p>
                {modes.speech ? (
                  <div className="space-y-2">
                    <Button
                      size="lg"
                      className={TAP}
                      variant={modes.touch ? "outline" : "default"}
                      onClick={startListening}
                      aria-pressed={listening}
                    >
                      <Mic className="size-6" aria-hidden="true" />
                      {listening ? "Mendengarkan..." : "Ucapkan jawaban"}
                    </Button>
                    {heard ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="min-w-0 flex-1 rounded-lg bg-muted/60 px-3 py-2 text-base">
                          Saya dengar: {heard}
                        </p>
                        <Button size="lg" className={TAP} onClick={submitSpeech}>
                          <Check className="size-5" aria-hidden="true" />
                          Kirim jawaban
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {modes.keyboard ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      value={typed}
                      onChange={(event) => setTyped(event.target.value)}
                      placeholder="Ketik jawabanmu di sini"
                      aria-label="Ketik jawaban"
                      className="min-h-[var(--spacing-student-tap)] flex-1 text-base"
                    />
                    <Button size="lg" className={TAP} onClick={submitTyped}>
                      <Check className="size-5" aria-hidden="true" />
                      Kirim
                    </Button>
                  </div>
                ) : null}

                {modes.switch ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-muted-foreground">
                        Mode sakelar: Tekan tombol saat pilihan yang kamu mau menyala.
                      </p>
                      <Button
                        size="lg"
                        className={TAP}
                        variant={scanEnabled ? "default" : "outline"}
                        onClick={() => {
                          setScanEnabled(!scanEnabled);
                          setScanIndex(0);
                        }}
                      >
                        {scanEnabled ? "Hentikan pemindaian" : "Mulai pemindai"}
                      </Button>
                    </div>

                    {scanEnabled && interaction && (
                      <p className="text-sm font-medium text-primary">
                        → {interaction.options[scanIndex]?.label}
                      </p>
                    )}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {perluKonfirmasi ? (
            <Card className="border-warning/40 bg-warning/10">
              <CardContent className="space-y-3 py-5">
                <p className="text-base font-semibold">Maksudmu jawabannya ini?</p>
                <p className="rounded-lg bg-background px-3 py-2 text-base">
                  Saya dengar: {perluKonfirmasi.jawaban}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button size="lg" className={TAP} onClick={konfirmasiBenar}>
                    <Check className="size-5" aria-hidden="true" />
                    Ya, itu jawabanku
                  </Button>
                  <Button variant="outline" size="lg" className={TAP} onClick={konfirmasiUlangi}>
                    <RotateCcw className="size-5" aria-hidden="true" />
                    Coba lagi
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="lg"
              className={TAP}
              disabled={index === 0}
              onClick={() => goToSection(Math.max(index - 1, 0))}
            >
              <ArrowLeft className="size-5" aria-hidden="true" />
              Sebelumnya
            </Button>

            {isLast ? (
              <Button size="lg" className={`${TAP} flex-1`} onClick={finish}>
                Selesai belajar
                <Check className="size-5" aria-hidden="true" />
              </Button>
            ) : (
              <Button
                size="lg"
                className={`${TAP} flex-1`}
                onClick={() => goToSection(index + 1)}
              >
                Berikutnya
                <ArrowRight className="size-5" aria-hidden="true" />
              </Button>
            )}
          </div>

          {answered ? (
            <p className="text-sm text-muted-foreground">
              Kamu menjawab {correctCount} dari {sections.length} bagian dengan tepat.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}