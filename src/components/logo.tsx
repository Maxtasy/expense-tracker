export function Logo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <g transform="rotate(-90 32 32)">
        <circle cx="32" cy="32" r="24" fill="none" stroke="#6366F1" strokeWidth="11" strokeLinecap="round" strokeDasharray="63.13 87.67" strokeDashoffset="0" />
        <circle cx="32" cy="32" r="24" fill="none" stroke="#38BDF8" strokeWidth="11" strokeLinecap="round" strokeDasharray="44.89 105.91" strokeDashoffset="-66.63" />
        <circle cx="32" cy="32" r="24" fill="none" stroke="#34D399" strokeWidth="11" strokeLinecap="round" strokeDasharray="32.27 118.53" strokeDashoffset="-115.02" />
      </g>
    </svg>
  );
}
