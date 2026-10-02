// Coin-stack mark from the Maxtasy design system. Stroke colors come from --logo-* tokens in
// globals.css so the mark picks up the deeper on-light tones in the light theme.
export function Logo({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      strokeWidth={12}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M13 12H35" style={{ stroke: "var(--logo-mint)" }} />
      <path d="M8 24H40" style={{ stroke: "var(--logo-sky)" }} />
      <path d="M8 36H40" style={{ stroke: "var(--logo-indigo)" }} />
    </svg>
  );
}
