// Raw CSS in an inline <style> tag, not Tailwind peer-* utilities: same Turbopack dev-server quirk
// as Spinner (see CLAUDE.md gotchas). A real checkbox with role="switch" underneath, so forms,
// keyboard and screen readers behave as before.
export function Switch({
  name,
  checked,
  defaultChecked,
  onChange,
  disabled,
  ariaLabel,
}: {
  name?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  ariaLabel: string;
}) {
  return (
    <>
      <style>{`
        .switch { position: relative; display: inline-flex; height: 44px; width: 52px; flex-shrink: 0; align-items: center; justify-content: center; cursor: pointer; }
        .switch-input { position: absolute; inset: 0; margin: 0; opacity: 0; cursor: inherit; }
        .switch-track { position: relative; height: 24px; width: 44px; border-radius: 9999px; border: 1px solid var(--color-fg-muted); background: var(--color-surface-hover); transition: background-color 150ms, border-color 150ms; pointer-events: none; }
        .switch-track::after { content: ""; position: absolute; top: 2px; left: 2px; height: 18px; width: 18px; border-radius: 9999px; background: var(--color-fg-muted); transition: transform 150ms, background-color 150ms; }
        .switch-input:checked + .switch-track { background: var(--color-accent); border-color: var(--color-accent); }
        .switch-input:checked + .switch-track::after { transform: translateX(20px); background: var(--color-accent-fg); }
        .switch-input:focus-visible + .switch-track { outline: 2px solid var(--color-accent); outline-offset: 2px; }
        .switch-input:disabled { cursor: not-allowed; }
        .switch-input:disabled + .switch-track { opacity: 0.5; }
      `}</style>
      <span className="switch">
        <input
          type="checkbox"
          role="switch"
          name={name}
          checked={checked}
          defaultChecked={defaultChecked}
          onChange={onChange}
          disabled={disabled}
          aria-label={ariaLabel}
          className="switch-input"
        />
        <span className="switch-track" aria-hidden="true" />
      </span>
    </>
  );
}
