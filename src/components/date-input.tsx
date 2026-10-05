"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useDateFormat } from "@/app/dashboard/date-format-context";
import { getDatePattern, isoToPattern, patternToIso } from "@/lib/date-format";

// A native <input type="date"> always renders in the browser's own format, ignoring the date format
// chosen in Settings. This shows a text field in the chosen pattern (e.g. DD.MM.YYYY) instead and
// submits a normalized YYYY-MM-DD under `name`; the calendar button opens the native picker.
export function DateInput({
  name,
  defaultValue = "",
  required,
  ariaLabel,
  className = "",
}: {
  name: string;
  defaultValue?: string;
  required?: boolean;
  ariaLabel?: string;
  className?: string;
}) {
  const t = useTranslations("validation");
  const locale = useLocale();
  const dateFormat = useDateFormat();
  const pattern = getDatePattern(dateFormat, locale);

  // null = untouched, so the field keeps following defaultValue (e.g. today once the browser's
  // local date is known) and falls back to it when the surrounding form is reset.
  const [typed, setTyped] = useState<string | null>(null);
  const text = typed ?? isoToPattern(defaultValue, pattern);
  const iso = patternToIso(text, pattern) ?? "";

  const textRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const form = textRef.current?.form;
    if (!form) return;
    const onReset = () => setTyped(null);
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, []);

  function update(next: string) {
    setTyped(next);
    const valid = next.trim() === "" || patternToIso(next, pattern) !== null;
    textRef.current?.setCustomValidity(valid ? "" : t("dateInvalid"));
  }

  return (
    <div className="relative">
      <input
        ref={textRef}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        required={required}
        aria-label={ariaLabel}
        placeholder={pattern}
        value={text}
        onChange={(e) => update(e.target.value)}
        className={`${className} pr-10`}
      />
      <input type="hidden" name={name} value={iso} />
      <button
        type="button"
        aria-label={t("pickDate")}
        title={t("pickDate")}
        onClick={() => pickerRef.current?.showPicker()}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-fg-muted hover:text-fg"
      >
        <CalendarDays size={16} />
      </button>
      {/* only used to open the browser's calendar; its value is mirrored into the text field */}
      <input
        ref={pickerRef}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        value={iso}
        onChange={(e) => e.target.value && update(isoToPattern(e.target.value, pattern))}
        className="pointer-events-none absolute bottom-0 right-0 h-0 w-0 opacity-0"
      />
    </div>
  );
}
