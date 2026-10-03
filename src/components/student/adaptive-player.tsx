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
/** Fallback pacing when the browser does not report word boundaries. */
const WORDS_PER_SECOND = 2.2;
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
  /** True once the browser reports word boundaries; disables the timer fallback. */
  const [batasKataDipakai, setBatasKataDipakai] = React.useState(false);

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

  /** Stop audio and reset the highlight without touching answer state. */
  function stopSpeaking() {
    if (bisaSuara) {
      window.speechSynthesis.cancel();
    }
    setPlaying(false);
    setPaused(false);
    setWordIndex(0);
  }

  /**
   * Speaks a script with the browser engine and follows its word boundary
   * events, which is what PRD 6.G asks for. Falls back to a timer when the
   * engine reports no boundaries, so the highlight still advances.
   */
  function speak(target: Naskah) {
    const script = target === "soal" ? scriptSoal : scriptMateri;
    if (!script) return;

    setNaskah(target);
    setWordIndex(0);
    setPlaying(true);
    setPaused(false);

    if (!bisaSuara) {
      setBatasKataDipakai(false);
      return;
    }

    const synth = window.speechSynthesis;
    synth.cancel();
    setBatasKataDipakai(false);

    const utter = new SpeechSynthesisUtterance(script);
    utter.lang = "id-ID";
    utter.rate = speed;
    utter.onboundary = (event) => {
      if (typeof event.charIndex !== "number") return;
      setBatasKataDipakai(true);
      setWordIndex(Math.max(0, posisiDariCharIndex(script, event.charIndex)));
    };
    utter.onend = () => {
      setPlaying(false);
      setPaused(false);
      setWordIndex(0);
    };
    utter.onerror = () => {
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
   * Play, pause, or resume depending on the current state.
   *
   * Without speechSynthesis support this falls back to the highlight timer so
   * the button still does something visible.
   */
  function togglePlay() {
    if (!bisaSuara) {
      setNaskah("materi");
      setPlaying((value) => !value);
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

  // Fallback pacing, active only when the engine gave no word boundaries.
  React.useEffect(() => {
    if (!playing || !uiTokens.audioEnabled) return;
    if (bisaSuara && batasKataDipakai) return;
    const interval = window.setInterval(() => {
      setWordIndex((current) => {
        if (current + 1 >= words.length) {
          setPlaying(false);
          return 0;
        }
        return current + 1;
      });
    }, 1000 / (WORDS_PER_SECOND * speed));
    return () => window.clearInterval(interval);
  }, [
    playing,
    speed,
    words.length,
    uiTokens.audioEnabled,
    batasKataDipakai,
    bisaSuara,
  ]);

  // Never leave audio running when leaving the page.
  React.useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function goToSection(next: number) {
    stopSpeaking();
    setIndex(next);
    setTyped("");
    setHeard("");
    setPerluKonfirmasi(null);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function submitAnswer(response: string, correct: boolean) {
    if (answered) return;
    setPerluKonfirmasi(null);
    setAnswers((current) => ({ ...current, [index]: { response, correct } }));
    stopSpeaking();
  }

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
      submitAnswer(teks || cadangan, true);
      return;
    }

    if (hasil.hampirBenar && hasil.kunciTerdekat) {
      setPerluKonfirmasi({ jawaban: teks || cadangan, kunci: hasil.kunciTerdekat });
      return;
    }

    submitAnswer(teks || cadangan, false);
  }

  function konfirmasiBenar() {
    if (!perluKonfirmasi) return;
    submitAnswer(perluKonfirmasi.jawaban, true);
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
                  <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
                    Kamu dapat memakai sakelar tunggal. Tekan pilihan di atas satu kali,
                    lalu sakelar untuk mengonfirmasi jawaban.
                  </p>
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