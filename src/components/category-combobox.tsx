"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

type Option = { id: string; name: string };

// Searchable replacement for the category <select>: focusing clears the field and lists every
// category, typing filters by case-insensitive substring. The chosen id is submitted under `name`
// through a hidden input, so the surrounding forms and Server Actions are unchanged. Callers pass
// the already type-filtered list and re-key on type, like they did with the <select>.
export function CategoryCombobox({
  categories,
  defaultValue = "",
  name = "categoryId",
  ariaLabel,
  className = "",
}: {
  categories: Option[];
  defaultValue?: string;
  name?: string;
  ariaLabel: string;
  className?: string;
}) {
  const tCommon = useTranslations("common");
  const t = useTranslations("dashboard.form");
  const listId = useId();
  const hiddenRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const options = useMemo<Option[]>(
    () => [{ id: "", name: tCommon("uncategorized") }, ...categories],
    [categories, tCommon],
  );

  const [selectedId, setSelectedId] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const selected = options.find((o) => o.id === selectedId) ?? options[0];
  const needle = query.trim().toLowerCase();
  const filtered = open && needle ? options.filter((o) => o.name.toLowerCase().includes(needle)) : options;

  // the forms call form.reset() after a successful add; React state wouldn't follow that on its own
  useEffect(() => {
    const form = hiddenRef.current?.form;
    if (!form) return;
    const onReset = () => {
      setSelectedId(defaultValue);
      setOpen(false);
    };
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, [defaultValue]);

  useEffect(() => {
    if (open) document.getElementById(`${listId}-opt-${activeIndex}`)?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex, listId]);

  function openList() {
    if (open) return;
    setQuery("");
    setActiveIndex(Math.max(0, options.findIndex((o) => o.id === selectedId)));
    setOpen(true);
  }

  function close() {
    setOpen(false);
    setQuery("");
  }

  function choose(option: Option) {
    setSelectedId(option.id);
    close();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        openList();
        return;
      }
      if (filtered.length === 0) return;
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((i) => (i + step + filtered.length) % filtered.length);
    } else if (e.key === "Enter" && open) {
      // don't submit the form while the list is open
      e.preventDefault();
      const option = filtered[activeIndex];
      if (option) choose(option);
    } else if (e.key === "Escape" && open) {
      // restore the previous selection without also closing the surrounding dialog
      e.preventDefault();
      e.stopPropagation();
      close();
    }
  }

  return (
    <div className="relative">
      <input type="hidden" ref={hiddenRef} name={name} value={selectedId} />
      <input
        type="text"
        role="combobox"
        autoComplete="off"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && filtered[activeIndex] ? `${listId}-opt-${activeIndex}` : undefined}
        value={open ? query : selected.name}
        onFocus={openList}
        onClick={openList}
        onBlur={close}
        onChange={(e) => {
          setQuery(e.target.value);
          setActiveIndex(0);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        className={className}
      />
      {open && (
        <ul
          id={listId}
          ref={listRef}
          role="listbox"
          aria-label={ariaLabel}
          style={{ position: "absolute", left: 0, right: 0, top: "100%", zIndex: 20, maxHeight: "11rem", overflowY: "auto", marginTop: 4 }}
          className="rounded-lg border border-border bg-surface py-1 text-sm shadow-lg"
        >
          {filtered.length === 0 ? (
            <li role="presentation" className="px-3 py-2 text-fg-muted">
              {t("noMatchingCategory")}
            </li>
          ) : (
            filtered.map((o, i) => (
              <li
                key={o.id || "none"}
                id={`${listId}-opt-${i}`}
                role="option"
                aria-selected={o.id === selectedId}
                // keep focus in the input so blur doesn't close the list before the click lands
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(o)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`cursor-pointer px-3 py-2 text-fg ${i === activeIndex ? "bg-surface-hover" : ""} ${o.id === selectedId ? "font-medium" : ""}`}
              >
                {o.name}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
