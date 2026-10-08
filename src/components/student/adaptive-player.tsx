"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { AUDIO_SPEED_VALUE } from "@/lib/constants";
import { cocokkanJawaban } from "@/lib/answer-match";
import { completeLearningSessionAction, recordProgressAction, startLearningSessionAction } from "@/actions/student";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Ear,
  Keyboard,
  Loader2,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  X,
} from "lucide-react";
import { DragInteraction } from "./drag-interaction";
import type { AdaptedInteraction, AdaptedSection, VisualAsset } from "@/lib/dummy/types";
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
const WORDS_PER_SECOND = 1.9;
const JEDA_BOUNDARY_MS = 600;
const KATA_PENANDA = ["pertama", "kedua", "ketiga", "keempat", "kelima"];

type Answer = { response: string; correct: boolean };
type Naskah = "materi" | "soal";

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

function nomorUrut(n: number): string { return KATA_PENANDA[n] ?? `ke-${n + 1}`; }
function waktuSekarang(): number { return performance.now(); }

function naskahSoal(interaction: AdaptedInteraction | null): string {
  if (!interaction) return "";
  const opsi = interaction.options.map((option, position) => `Pilihan ${nomorUrut(position)}, ${option.label}`).join(". ");
  return [interaction.prompt, opsi].filter(Boolean).join(" ");
}

function naskahMateri(section: AdaptedSection | undefined): string {
  if (!section) return "";
  const bagian = [section.title, ...section.body].filter(Boolean);
  const soalParts = section.interactions.map((interaction, i) => {
    const prefix = section.interactions.length > 1 ? `Soal ${nomorUrut(i)}. ` : "";
    return prefix + naskahSoal(interaction);
  }).filter(Boolean);
  return [...bagian, ...soalParts].join(". ").trim();
}

function getRecognition(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
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
  token: string;
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
  const [perluKonfirmasi, setPerluKonfirmasi] = React.useState<{ jawaban: string; kunci: string } | null>(null);
  const [scanEnabled, setScanEnabled] = React.useState(false);
  const [scanIndex, setScanIndex] = React.useState(0);
  const [finishing, setFinishing] = React.useState(false);

  const modeBoundary = React.useRef(false);
  const batasTerakhir = React.useRef(0);
  const mulaiSuara = React.useRef(0);
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const mulaiSesiRef = React.useRef<number>(0);
  const masukBagianRef = React.useRef<Record<number, number>>({});

  const section = sections[index];
  const interaction = section?.interactions[0] ?? null;
  const scriptMateri = React.useMemo(() => naskahMateri(section), [section]);
  const scriptSoal = React.useMemo(() => naskahSoal(interaction), [interaction]);
  const teksNaskah = naskah === "soal" ? scriptSoal : scriptMateri;
  const words = React.useMemo(() => teksNaskah.split(/\s+/).filter(Boolean), [teksNaskah]);
  const answered = answers[index];
  const bisaSuara = typeof window !== "undefined" && "speechSynthesis" in window;
  const progress = sections.length ? ((index + 1) / sections.length) * 100 : 0;

  function posisiDariCharIndex(script: string, charIndex: number): number {
    const selesai = script.slice(0, charIndex).split(/\s+/).filter(Boolean).length;
    const total = script.split(/\s+/).filter(Boolean).length;
    return Math.min(Math.max(selesai, 0), Math.max(total - 1, 0));
  }

  function stopSpeaking() {
    if (bisaSuara) window.speechSynthesis.cancel();
    setPlaying(false);
    setPaused(false);
    setWordIndex(0);
    modeBoundary.current = false;
    mulaiSuara.current = 0;
  }

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

    if (!bisaSuara) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(script);
    utter.lang = "id-ID";
    utter.rate = speed;
    utter.onboundary = (event) => {
      if (event.name === "sentence") return;
      if (event.name && event.name !== "word") return;
      if (typeof event.charIndex !== "number") return;
      modeBoundary.current = true;
      batasTerakhir.current = performance.now();
      setWordIndex(posisiDariCharIndex(script, event.charIndex));
    };
    utter.onend = () => { modeBoundary.current = false; mulaiSuara.current = 0; setPlaying(false); setPaused(false); setWordIndex(0); };
    utter.onerror = () => { modeBoundary.current = false; mulaiSuara.current = 0; setPlaying(false); setPaused(false); };
    synth.speak(utter);
  }

  function repeatCurrent() { speak(naskah); }
  function repeatQuestion() { speak("soal"); }

  function togglePlay() {
    if (!bisaSuara) {
      setNaskah("materi");
      if (!playing) { mulaiSuara.current = performance.now(); batasTerakhir.current = performance.now(); setWordIndex(0); }
      setPlaying((value) => !value);
      return;
    }
    const synth = window.speechSynthesis;
    if (playing && !paused) { synth.pause(); setPaused(true); return; }
    if (playing && paused) { synth.resume(); setPaused(false); return; }
    speak("materi");
  }

  function ubahKecepatan(value: number) {
    setSpeed(value);
    if (playing) speak(naskah);
  }

  React.useEffect(() => {
    if (!playing || paused || !uiTokens.audioEnabled) return;
    const totalKata = Math.max(words.length, 1);
    const tick = window.setInterval(() => {
      if (modeBoundary.current) return;
      if (performance.now() - batasTerakhir.current < JEDA_BOUNDARY_MS) return;
      const durasi = ((totalKata - 1) / (WORDS_PER_SECOND * speed)) * 1000;
      const posisi = durasi > 0 ? Math.floor(((performance.now() - mulaiSuara.current) / durasi) * (totalKata - 1)) : 0;
      setWordIndex(Math.min(posisi, totalKata - 1));
    }, 100);
    return () => window.clearInterval(tick);
  }, [playing, paused, speed, words.length, uiTokens.audioEnabled]);

  React.useEffect(() => () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  React.useEffect(() => {
    if (!scanEnabled || !interaction || answered) return;
    const interval = window.setInterval(() => setScanIndex((current) => (current + 1) % interaction.options.length), 2000);
    return () => window.clearInterval(interval);
  }, [scanEnabled, interaction, answered]);

  React.useEffect(() => {
    let batal = false;
    mulaiSesiRef.current = waktuSekarang();
    masukBagianRef.current[0] = waktuSekarang();
    void (async () => {
      try {
        const hasil = await startLearningSessionAction({ token, adaptationId });
        if (batal) return;
        if (hasil.ok && hasil.sessionId) setSessionId(hasil.sessionId);
      } catch {}
    })();
    return () => { batal = true; };
  }, [token, adaptationId]);

  function catatJawaban(sectionIndex: number, interactionType: string, response: string, correct: boolean) {
    if (!sessionId) return;
    const masuk = masukBagianRef.current[sectionIndex] ?? waktuSekarang();
    void recordProgressAction({
      token,
      sessionId,
      sectionIndex,
      interactionType,
      response,
      isCorrect: correct,
      timeSpentSeconds: Math.max(0, Math.round((waktuSekarang() - masuk) / 1000)),
    }).catch(() => {});
  }

  function submitAnswer(response: string, correct: boolean, interactionType: "touch" | "speech" | "text" | "drag" = "touch") {
    if (answered) return;
    setPerluKonfirmasi(null);
    setAnswers((current) => ({ ...current, [index]: { response, correct } }));
    catatJawaban(index, interactionType, response, correct);
    stopSpeaking();
  }

  function goToSection(next: number) {
    stopSpeaking();
    setIndex(next);
    setTyped("");
    setHeard("");
    setPerluKonfirmasi(null);
    setScanEnabled(false);
    setScanIndex(0);
    masukBagianRef.current[next] = waktuSekarang();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

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

  function startListening() {
    const recognition = getRecognition();
    if (!recognition) {
      setListening(true);
      window.setTimeout(() => { setListening(false); setHeard(interaction?.acceptedAnswers[0] ?? ""); }, 1200);
      return;
    }
    try {
      recognition.lang = "id-ID";
      recognition.interimResults = false;
      recognition.onresult = (event) => { setHeard(event.results[0]?.[0]?.transcript ?? ""); setListening(false); };
      recognition.onend = () => setListening(false);
      recognition.onerror = () => setListening(false);
      recognition.start();
      setListening(true);
    } catch { setListening(false); }
  }

  async function finish() {
    setFinishing(true);
    const correctCount = Object.values(answers).filter((item) => item.correct).length;
    const total = sections.filter((item) => item.interactions.length > 0).length;
    if (sessionId) {
      const durasi = Math.max(1, Math.round((waktuSekarang() - mulaiSesiRef.current) / 1000));
      await completeLearningSessionAction({ token, sessionId, durationSeconds: durasi }).catch(() => {});
    }
    router.push(`${doneHref}?benar=${correctCount}&dijawab=${Object.keys(answers).length}&total=${total}`);
  }

  React.useEffect(() => {
    if (!scanEnabled || !interaction || answered) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.code === "Space" || event.code === "Enter") {
        event.preventDefault();
        const option = interaction.options[scanIndex];
        if (option) { submitAnswer(option.label, option.correct); setScanEnabled(false); }
      }
      if (event.code === "Escape") { event.preventDefault(); setScanEnabled(false); }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanEnabled, interaction, scanIndex, answered]);

  if (!section) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <div className="rounded-[2.5rem] bg-white/80 p-8 text-center shadow-sm ring-1 ring-black/[0.04]">
          <h1 className="font-heading text-2xl font-black">Belum ada bagian materi.</h1>
          <p className="mt-2 text-sm text-[#17352f]/55">Minta guru memeriksa materi yang diterbitkan.</p>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const correctCount = Object.values(answers).filter((item) => item.correct).length;
  const itemAsset = assets.find((entry) => entry.sectionIndex === index) ?? null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
      <div className="sticky top-[calc(var(--spacing-student-tap)+.5rem)] z-30 mb-5 rounded-[1.5rem] border border-white/90 bg-[#fdfcf8]/85 p-3 shadow-[0_12px_35px_rgba(23,53,47,.08)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Link href={listHref} className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white text-[#33635a] shadow-sm transition-transform duration-160 ease-out hover:-translate-x-0.5 active:scale-[0.97]" aria-label="Kembali ke daftar materi">
            <ArrowLeft className="size-5" aria-hidden="true" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-bold uppercase tracking-[0.12em] text-[#33635a]/55">{subject} · {studentName}</p>
                <p className="truncate font-heading text-base font-black">{materialTitle}</p>
              </div>
              <span className="shrink-0 rounded-full bg-[#eff9f4] px-3 py-1.5 text-xs font-black text-[#33635a]">{index + 1}/{sections.length}</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e9e8df]">
              <div className="h-full rounded-full bg-[#33635a] transition-[width] duration-300 ease-out" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
        <div className="mt-3 flex gap-1.5 px-0.5">
          {sections.map((_, dotIndex) => (
            <button key={dotIndex} type="button" onClick={() => goToSection(dotIndex)} aria-label={`Buka bagian ${dotIndex + 1}`} className={cn("h-1.5 flex-1 rounded-full transition-colors duration-150 ease-out", dotIndex === index ? "bg-[#33635a]" : answers[dotIndex] ? "bg-[#9fceba]" : "bg-[#dddcd2]")} />
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <main className="min-w-0">
          <section key={index} className="relative overflow-hidden rounded-[2.75rem] border border-white/90 bg-white/84 shadow-[0_25px_90px_rgba(23,53,47,.10)] backdrop-blur-xl">
            <div className="absolute -right-14 -top-16 size-48 rounded-full bg-[#bfead4]/40 blur-2xl" aria-hidden="true" />
            <div className="absolute -left-10 bottom-10 size-32 rounded-full bg-[#ffd8bf]/35 blur-2xl" aria-hidden="true" />
            <div className="relative p-5 sm:p-8 md:p-10">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#17352f] px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-white">Bagian {index + 1}</span>
                {answered ? (
                  <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black", answered.correct ? "bg-[#e5f7ee] text-[#2f765b]" : "bg-[#fff1e8] text-[#8a5444]")}>{answered.correct ? <CheckCircle2 className="size-3.5" /> : <X className="size-3.5" />} {answered.correct ? "Tepat" : "Belum tepat"}</span>
                ) : null}
              </div>

              <h1 className="mt-5 max-w-3xl font-heading text-4xl font-black leading-[1.02] tracking-[-0.05em] text-[#17352f] sm:text-5xl">{section.title}</h1>

              {itemAsset?.imageUrl ? (
                <div className="relative mt-7 overflow-hidden rounded-[2rem] border-4 border-white bg-[#edf5f1] shadow-sm">
                  <div role="img" aria-label={section.media[0]?.altText ?? "Ilustrasi materi"} className="aspect-[16/8] w-full bg-cover bg-center" style={{ backgroundImage: `url(${itemAsset.imageUrl})` }} />
                  <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-[#17352f] shadow-sm backdrop-blur">Lihat · pikir · pahami</div>
                </div>
              ) : (
                <div className="mt-7 grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[2rem] bg-[#eff9f4] p-4 sm:p-5">
                  <span className="grid size-12 place-items-center rounded-2xl bg-white text-[#33635a] shadow-sm"><Sparkles className="size-5" /></span>
                  <div><p className="font-heading text-sm font-black">Materi dibuat untukmu</p><p className="text-xs leading-5 text-[#17352f]/50">Baca bagian ini dengan tenang sebelum menjawab.</p></div>
                  <Ear className="size-5 text-[#33635a]/45" />
                </div>
              )}

              <div className="mt-7 space-y-4">
                {section.body.map((line, lineIndex) => (
                  <p key={lineIndex} className="max-w-3xl text-xl leading-[1.75] text-[#17352f]/82 sm:text-[1.4rem]">{line}</p>
                ))}
              </div>

              {interaction ? (
                <div className="mt-8 rounded-[2rem] bg-[#17352f] p-4 text-white shadow-[0_18px_45px_rgba(23,53,47,.16)] sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-[#bfead4]"><Sparkles className="size-3.5" /> Giliranmu</span>
                      <h2 className="mt-3 text-2xl font-black leading-tight sm:text-3xl">{interaction.prompt}</h2>
                    </div>
                    {uiTokens.audioEnabled ? (
                      <Button variant="outline" size="lg" className={`${TAP} shrink-0 rounded-2xl border-white/15 bg-white/10 font-bold text-white hover:bg-white/15 hover:text-white active:scale-[0.97]`} onClick={repeatQuestion}>
                        <Volume2 className="size-5" /> Dengarkan soal
                      </Button>
                    ) : null}
                  </div>

                  {interaction.kind === "drag" && !answered ? (
                    <div className="mt-5 rounded-[1.5rem] bg-white/5 p-3 sm:p-4">
                      <DragInteraction interaction={interaction} onSubmit={(answer, correct) => submitAnswer(answer, correct, "drag")} tapClassName={`${TAP} rounded-2xl`} />
                    </div>
                  ) : (
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {interaction.options.map((option, optionIndex) => {
                        const activeScan = scanEnabled && scanIndex === optionIndex && !answered;
                        const isChosen = answered?.response === option.label;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            disabled={Boolean(answered)}
                            onClick={() => submitAnswer(option.label, option.correct)}
                            className={cn(
                              "group relative min-h-20 rounded-[1.5rem] border-2 px-5 py-4 text-left text-lg font-black outline-none transition-[transform,background-color,border-color,box-shadow] duration-180 ease-out focus-visible:ring-2 focus-visible:ring-[#bfead4] active:scale-[0.985]",
                              answered
                                ? option.correct
                                  ? "border-[#9fceba] bg-[#dff3e9] text-[#17352f]"
                                  : isChosen
                                    ? "border-[#e0b6a0] bg-[#fff0e8] text-[#7e5143]"
                                    : "border-white/10 bg-white/5 text-white/60"
                                : activeScan
                                  ? "border-[#ffe9a6] bg-[#fff4cc] text-[#17352f] shadow-[0_0_0_4px_rgba(255,233,166,.18)]"
                                  : "border-white/12 bg-white/6 text-white hover:border-white/25 hover:bg-white/10",
                            )}
                          >
                            <span className="flex items-center gap-3">
                              <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl text-sm font-black", answered ? option.correct ? "bg-white/80 text-[#2f765b]" : "bg-white/60 text-[#8a5444]" : "bg-white/10 text-[#bfead4]")}>{optionIndex + 1}</span>
                              <span>{option.label}</span>
                            </span>
                            <ChevronRight className="absolute right-4 top-1/2 size-5 -translate-y-1/2 opacity-0 transition-all duration-180 ease-out group-hover:translate-x-0.5 group-hover:opacity-70" />
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {answered ? (
                    <div className={cn("mt-5 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold", answered.correct ? "bg-[#bfead4] text-[#17352f]" : "bg-[#ffd8bf] text-[#6e493f]")}>
                      {answered.correct ? <CheckCircle2 className="size-5 shrink-0" /> : <X className="size-5 shrink-0" />}
                      {answered.correct ? "Bagus. Jawabanmu tepat!" : "Belum tepat. Tidak apa-apa — kita lanjut dan coba lagi di materi berikutnya."}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </section>

          {interaction && !answered ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {modes.speech ? <AnswerMode label={listening ? "Sedang mendengarkan…" : heard ? `Terdengar: ${heard}` : "Jawab dengan suara"} icon={<Mic className="size-5" />} active={listening} onClick={heard ? () => nilaiJawaban(heard, "suara") : startListening} /> : null}
              {modes.keyboard ? <div className="col-span-full rounded-[1.75rem] border border-white/80 bg-white/70 p-3 shadow-sm"><div className="flex items-center gap-2 px-2 pb-2 text-xs font-black uppercase tracking-[0.12em] text-[#17352f]/45"><Keyboard className="size-4" /> Jawab dengan ketikan</div><div className="flex gap-2"><Input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Ketik jawabanmu…" className="min-h-14 flex-1 rounded-2xl border-[#17352f]/10 bg-white text-base font-semibold" aria-label="Ketik jawaban" /><Button size="lg" className={`${TAP} shrink-0 rounded-2xl bg-[#33635a] font-black text-white active:scale-[0.97]`} onClick={() => nilaiJawaban(typed, "ketik")}><Check className="size-5" /> Kirim</Button></div></div> : null}
            </div>
          ) : null}

          {perluKonfirmasi ? (
            <div className="mt-4 rounded-[1.75rem] border-2 border-[#ffe9a6] bg-[#fff9df] p-4 shadow-sm sm:p-5">
              <div className="flex gap-3">
                <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white text-[#735d18] shadow-sm"><Ear className="size-5" /></div>
                <div className="min-w-0 flex-1">
                  <p className="font-heading text-lg font-black text-[#5d511d]">Maksudmu “{perluKonfirmasi.kunci}”?</p>
                  <p className="mt-1 text-sm leading-6 text-[#17352f]/55">Kami menangkap jawabanmu sedikit berbeda. Kamu bisa mengonfirmasi atau mencoba lagi.</p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row"><Button size="lg" className={`${TAP} rounded-2xl bg-[#33635a] font-black text-white active:scale-[0.97]`} onClick={() => submitAnswer(perluKonfirmasi.jawaban, true, "speech")}><Check className="size-5" /> Ya, benar</Button><Button size="lg" variant="outline" className={`${TAP} rounded-2xl bg-white font-bold active:scale-[0.97]`} onClick={() => { setPerluKonfirmasi(null); setHeard(""); setTyped(""); }}><RotateCcw className="size-5" /> Coba lagi</Button></div>
                </div>
              </div>
            </div>
          ) : null}

          {uiTokens.audioEnabled ? (
            <section className="mt-4 overflow-hidden rounded-[2rem] border border-white/80 bg-white/70 shadow-sm">
              <div className="grid gap-4 p-4 sm:grid-cols-[auto_1fr] sm:p-5">
                <div className="flex flex-wrap gap-2">
                  <Button size="lg" className={`${TAP} rounded-2xl bg-[#33635a] font-black text-white shadow-sm active:scale-[0.97]`} onClick={togglePlay}>
                    {playing && !paused ? <Pause className="size-5" /> : <Play className="size-5" />} {playing && !paused ? "Jeda" : "Dengarkan"}
                  </Button>
                  <Button size="lg" variant="outline" className={`${TAP} rounded-2xl bg-white font-bold active:scale-[0.97]`} onClick={repeatCurrent}><RotateCcw className="size-5" /> Ulangi</Button>
                </div>
                <div className="min-w-0 rounded-[1.5rem] bg-[#f3f6f1] p-4">
                  <div className="flex items-center justify-between gap-3"><p className="text-xs font-black uppercase tracking-[0.12em] text-[#33635a]/60">{naskah === "soal" ? "Suara · soal" : "Suara · materi"}</p><span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-[#33635a]">{speed.toFixed(2)}×</span></div>
                  <p className="mt-3 text-base leading-7 text-[#17352f]/72">
                    {words.map((word, wordPosition) => <span key={`${word}-${wordPosition}`} className={cn("rounded px-0.5 transition-colors duration-100", playing && wordPosition === wordIndex && "bg-[#33635a] text-white")}>{word}{" "}</span>)}
                  </p>
                  <div className="mt-4 flex items-center gap-3"><span className="text-[11px] font-bold text-[#17352f]/40">Lambat</span><Slider min={0.5} max={1.5} step={0.05} value={[speed]} onValueChange={(value) => ubahKecepatan(value[0] ?? 1)} aria-label="Kecepatan pembacaan suara" /><span className="text-[11px] font-bold text-[#17352f]/40">Cepat</span></div>
                </div>
              </div>
            </section>
          ) : null}

          {modes.switch && interaction && !answered ? (
            <section className="mt-4 rounded-[1.75rem] border border-[#cbe7f6] bg-[#eef8fd] p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-heading font-black">Mode sakelar</p><p className="text-sm leading-6 text-[#17352f]/55">Pilihan akan menyala satu per satu. Tekan Enter atau Spasi saat pilihan yang kamu mau muncul.</p></div><Button size="lg" className={`${TAP} rounded-2xl font-black active:scale-[0.97]`} variant={scanEnabled ? "default" : "outline"} onClick={() => { setScanEnabled((value) => !value); setScanIndex(0); }}>{scanEnabled ? "Hentikan" : "Mulai pemindai"}</Button></div>
              {scanEnabled ? <div className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#33635a]">Pilihan aktif: {interaction.options[scanIndex]?.label ?? "—"}</div> : null}
            </section>
          ) : null}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button size="lg" variant="outline" className={`${TAP} rounded-2xl border-[#17352f]/10 bg-white/80 font-bold active:scale-[0.97] sm:w-auto`} disabled={index === 0} onClick={() => goToSection(Math.max(index - 1, 0))}><ArrowLeft className="size-5" /> Sebelumnya</Button>
            <div className="flex-1 text-center text-xs font-black uppercase tracking-[0.12em] text-[#17352f]/35">{answeredCount} jawaban · {correctCount} tepat</div>
            {index === sections.length - 1 ? <Button size="lg" className={`${TAP} rounded-2xl bg-[#33635a] font-black text-white shadow-sm active:scale-[0.97] sm:min-w-44`} disabled={finishing} onClick={finish}>{finishing ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Check className="size-5" />} {finishing ? "Menyimpan…" : "Selesai belajar"}</Button> : <Button size="lg" className={`${TAP} group rounded-2xl bg-[#33635a] font-black text-white shadow-sm active:scale-[0.97] sm:min-w-44`} onClick={() => goToSection(index + 1)}>Berikutnya <ArrowRight className="size-5 transition-transform duration-180 group-hover:translate-x-0.5" /></Button>}
          </div>
        </main>

        <aside className="hidden lg:block">
          <div className="sticky top-[calc(var(--spacing-student-tap)+5rem)] space-y-4">
            <div className="rounded-[2rem] border border-white/90 bg-white/75 p-5 shadow-sm backdrop-blur">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#33635a]/55">Peta belajarmu</p>
              <div className="mt-4 space-y-2">
                {sections.map((item, itemIndex) => <button key={itemIndex} type="button" onClick={() => goToSection(itemIndex)} className={cn("flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-transform duration-180 ease-out hover:-translate-y-0.5", itemIndex === index ? "bg-[#33635a] text-white" : answers[itemIndex] ? "bg-[#e5f7ee] text-[#17352f]" : "bg-[#f5f4ed] text-[#17352f]/62")}><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/80 text-xs font-black">{itemIndex + 1}</span><span className="min-w-0 flex-1 truncate text-sm font-bold">{item.title}</span>{answers[itemIndex] ? <Check className="size-4" /> : null}</button>)}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function AnswerMode({ label, icon, active, onClick }: { label: string; icon: React.ReactNode; active?: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={cn("group flex min-h-[var(--spacing-student-tap)] items-center gap-3 rounded-[1.5rem] border border-white/80 bg-white/75 px-4 text-left font-black text-[#17352f] shadow-sm transition-[transform,box-shadow,background-color] duration-180 ease-out hover:-translate-y-0.5 hover:bg-white active:scale-[0.985]", active && "bg-[#ffe9a6] shadow-[0_0_0_4px_rgba(255,233,166,.24)]")}><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#eff9f4] text-[#33635a] group-hover:bg-[#bfead4]">{icon}</span><span className="min-w-0 truncate">{label}</span><ArrowRight className="ml-auto size-5 text-[#33635a]/45 transition-transform duration-180 group-hover:translate-x-0.5" /></button>;
}
