// Raw CSS keyframes via an inline <style> tag, not Tailwind's `animate-spin`: this project's
// Turbopack dev server has been observed to silently drop newly-added utility classes, including
// plain hand-written CSS added to globals.css (see CLAUDE.md gotchas).
export function Spinner({ size = 15 }: { size?: number }) {
  return (
    <>
      <style>{`
        @keyframes spinner-rotate {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        style={{ animation: "spinner-rotate 0.7s linear infinite" }}
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
        <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </>
  );
}
