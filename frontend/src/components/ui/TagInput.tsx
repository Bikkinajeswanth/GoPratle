"use client";

import { useState, type KeyboardEvent } from "react";
import { inputBorder, inputClass } from "./Field";

type TagInputProps = {
  id: string;
  value: string[];
  onChange: (value: string[]) => void;
  onBlur?: () => void;
  placeholder?: string;
  max: number;
  invalid?: boolean;
  describedById?: string;
  suggestions?: readonly string[];
};

/** Free-text tags: type and press Enter or comma to add; click × to remove. */
export function TagInput({
  id,
  value,
  onChange,
  onBlur,
  placeholder,
  max,
  invalid = false,
  describedById,
  suggestions = [],
}: TagInputProps) {
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState("");

  const add = (raw: string) => {
    const tag = raw.trim().replace(/\s+/g, " ");
    if (!tag) return;
    if (value.some((v) => v.toLowerCase() === tag.toLowerCase())) {
      setNotice(`"${tag}" is already added`);
      return;
    }
    if (value.length >= max) {
      setNotice(`You can add up to ${max} skills`);
      return;
    }
    if (tag.length > 40) {
      setNotice("Keep each skill under 40 characters");
      return;
    }
    onChange([...value, tag]);
    setDraft("");
    setNotice("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const remaining = suggestions.filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()));

  return (
    <div>
      <div
        className={`${inputClass} ${inputBorder(invalid)} flex min-h-11 flex-wrap items-center gap-1.5 !py-1.5 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-100`}
      >
        {value.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-lg bg-brand-50 py-1 pl-2.5 pr-1 text-sm font-medium text-brand-800">
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((v) => v !== tag))}
              className="grid size-5 place-items-center rounded-md text-brand-600 hover:bg-brand-100"
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => {
            add(draft);
            onBlur?.();
          }}
          placeholder={value.length === 0 ? placeholder : "Add another…"}
          aria-invalid={invalid || undefined}
          aria-describedby={describedById}
          className="min-w-[10rem] flex-1 border-0 bg-transparent px-1 py-1 text-[15px] outline-none placeholder:text-slate-400"
        />
      </div>
      {notice && <p className="mt-1.5 text-[13px] text-amber-700">{notice}</p>}
      {remaining.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-500">Suggestions:</span>
          {remaining.slice(0, 6).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="rounded-full border border-dashed border-slate-300 px-2.5 py-0.5 text-xs text-slate-600 hover:border-brand-400 hover:text-brand-700"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
