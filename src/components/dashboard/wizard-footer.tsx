"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Footer wizard: Kembali, Lanjut, dan Simpan.
 *
 * Perhatikan `key` pada kedua cabang. Tanpa `key`, React memakai ulang node
 * `<button>` yang sama dan hanya menukar atribut `type` saat langkah berubah.
 * Browser lalu menjalankan default action dari node yang barusan diklik:
 * tombol "Lanjut" (type="button") berubah jadi "Simpan" (type="submit") dan
 * formulir terkirim sendiri. `key` memaksa React melepas node lama, jadi
 * tidak ada tombol submit yang bisa dipicu tanpa klik.
 */
export function WizardFooter({
  step,
  stepCount,
  pending = false,
  submitLabel,
  backLabel = "Kembali",
  nextLabel = "Lanjut",
  onBack,
  onNext,
}: {
  step: number;
  stepCount: number;
  pending?: boolean;
  submitLabel: string;
  backLabel?: string;
  nextLabel?: string;
  onBack: () => void;
  onNext: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const isLastStep = step >= stepCount - 1;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
      <Button type="button" variant="outline" onClick={onBack} disabled={step === 0}>
        <ArrowLeft aria-hidden />
        {backLabel}
      </Button>

      {isLastStep ? (
        <Button key="submit" type="submit" disabled={pending}>
          {pending ? (
            <Loader2 className="animate-spin" aria-hidden />
          ) : (
            <Save aria-hidden />
          )}
          {submitLabel}
        </Button>
      ) : (
        <Button key="next" type="button" onClick={onNext}>
          {nextLabel}
          <ArrowRight aria-hidden />
        </Button>
      )}
    </div>
  );
}