"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus, X } from "lucide-react";

export function TagInput({
  id,
  label,
  hint,
  placeholder,
  suggestions,
  value,
  onChange,
  required,
  invalid,
  error,
}: {
  id: string;
  label: string;
  hint?: string;
  placeholder: string;
  suggestions: string[];
  value: string[];
  onChange: (next: string[]) => void;
  required?: boolean;
  invalid?: boolean;
  error?: string;
}) {
  const [draft, setDraft] = React.useState("");

  function addTag(raw: string) {
    const tag = raw.trim();
    if (!tag) return;
    if (tag.length < 2) return;
    if (value.some((item) => item.toLowerCase() === tag.toLowerCase())) return;
    if (tag.length > 40) return;
    onChange([...value, tag]);
    setDraft("");
  }

  return (
    <div className="group/field flex flex-col gap-2">
      <label htmlFor={id} className="group/field-label w-fit text-sm leading-none font-medium">
        {label}
        {required ? (
          <span className="text-destructive" aria-hidden="true">
            {" "}
            *
          </span>
        ) : null}
      </label>
      {value.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <li key={tag}>
              <Badge className="gap-1 pr-1 pl-2.5">
                {tag}
                <button
                  type="button"
                  onClick={() => onChange(value.filter((item) => item !== tag))}
                  className="grid size-4 place-items-center rounded-full hover:bg-primary-foreground/20 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-foreground"
                  aria-label={`Hapus ${tag}`}
                >
                  <X className="size-3" aria-hidden="true" />
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex gap-2">
        <Input
          id={id}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              addTag(draft);
            }
          }}
          onBlur={() => addTag(draft)}
          placeholder={placeholder}
          aria-invalid={invalid}
          className={cn(invalid && "border-destructive")}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => addTag(draft)}
          disabled={!draft.trim()}
        >
          <Plus />
          Tambah
        </Button>
      </div>
      {error ? (
        <p className="text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>
      ) : null}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Saran:</span>
        {suggestions
          .filter((item) => !value.includes(item))
          .map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => addTag(item)}
              className="rounded-full border border-dashed px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              + {item}
            </button>
          ))}
      </div>
    </div>
  );
}