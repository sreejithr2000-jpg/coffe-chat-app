"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

interface TagInputProps {
  label?: string;
  hint?: string;
  error?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  max?: number;
  placeholder?: string;
  disabled?: boolean;
}

export function TagInput({
  label,
  hint,
  error,
  value,
  onChange,
  max = 10,
  placeholder = "Type and press Enter…",
  disabled = false,
}: TagInputProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase();
    if (!tag || value.includes(tag) || value.length >= max) return;
    onChange([...value, tag]);
    setInput("");
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && input === "" && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  }

  const atMax = value.length >= max;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-neutral-700">
            {label.endsWith(" *") ? (
              <>{label.slice(0, -2)} <span className="text-red-400 text-[11px]">*</span></>
            ) : label}
          </span>
          <span className={cn(
            "text-[11px] tabular-nums",
            atMax ? "text-amber-600" : "text-neutral-400"
          )}>
            {value.length}/{max}
          </span>
        </div>
      )}

      {/* Tag container — click anywhere to focus input */}
      <div
        onClick={() => inputRef.current?.focus()}
        className={cn(
          "flex min-h-[38px] flex-wrap gap-1.5 rounded-lg border bg-white px-2.5 py-1.5",
          "cursor-text transition-colors duration-150",
          "focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-100",
          error
            ? "border-red-400 focus-within:border-red-500 focus-within:ring-red-100"
            : "border-neutral-200",
          disabled && "cursor-not-allowed bg-neutral-50"
        )}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-md bg-primary-50 px-2 py-0.5 text-[12px] font-medium text-primary-700"
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
                className="ml-0.5 text-primary-400 hover:text-primary-700 focus:outline-none"
                aria-label={`Remove ${tag}`}
              >
                ×
              </button>
            )}
          </span>
        ))}

        {!atMax && !disabled && (
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => { if (input.trim()) addTag(input); }}
            placeholder={value.length === 0 ? placeholder : ""}
            className="min-w-[120px] flex-1 bg-transparent text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
            disabled={disabled}
          />
        )}
      </div>

      {error ? (
        <p className="text-[12px] text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-[12px] text-neutral-500">{hint}</p>
      ) : null}
    </div>
  );
}
