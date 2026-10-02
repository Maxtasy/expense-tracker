// Loading animation built from the logo mark: three coins drop in from the top one after another,
// land and bounce on each other to form the stack, hold for a second, then all fall away through
// the bottom, and the cycle repeats.
//
// The motion is described as a timeline of (time, offset) points per coin and compiled into CSS
// keyframes below. Falling uses an ease-in curve (distance grows with time squared, i.e. gravity),
// rebounds use ease-out, so each bounce decelerates on the way up and accelerates on the way down.
// Raw keyframes in an inline <style>, not Tailwind's animate-*: see CLAUDE.md's Turbopack gotcha.

type Point = {
  t: number; // seconds into the cycle
  y: number; // translateY in viewBox units (positive is down)
  x?: number;
  rot?: number; // degrees
  ease?: "gravity" | "rise" | "soft" | "linear"; // easing of the segment that starts at this point
};

const START_OFFSET = -56; // far enough above the viewBox that the coin is fully clipped
const END_OFFSET = 64; // far enough below the viewBox that the coin is fully clipped

const EASING = {
  gravity: "cubic-bezier(0.55, 0.085, 0.68, 0.53)", // ease-in quad: free fall
  rise: "cubic-bezier(0.25, 0.46, 0.45, 0.94)", // ease-out quad: decelerating rebound
  soft: "cubic-bezier(0.4, 0, 0.2, 1)", // compression and recovery when something lands on top
  linear: "linear",
} as const;

// One landing: free fall, then two rebounds of decreasing height (the first one is the big bounce).
function landing(start: number, fallTime: number, bounce: number, tilt: number, shift: number): Point[] {
  const land = start + fallTime;
  return [
    { t: start, y: START_OFFSET, rot: tilt, x: shift, ease: "gravity" },
    { t: land, y: 0, rot: 0, x: 0, ease: "rise" },
    { t: land + 0.09, y: -bounce, ease: "gravity" },
    { t: land + 0.18, y: 0, ease: "rise" },
    { t: land + 0.24, y: -bounce * 0.3, ease: "gravity" },
    { t: land + 0.3, y: 0, ease: "linear" },
  ];
}

// A coin getting pressed down a little when another one lands on it, then settling back.
function press(at: number, depth: number): Point[] {
  return [
    { t: at, y: 0, ease: "soft" },
    { t: at + 0.05, y: depth, ease: "soft" },
    { t: at + 0.16, y: 0, ease: "linear" },
  ];
}

function fallAway(at: number): Point[] {
  return [
    { t: at, y: 0, ease: "gravity" },
    { t: at + 0.55, y: END_OFFSET, ease: "linear" },
  ];
}

const FALL = 0.4; // seconds from release to first impact, the same for every coin
const SKY_START = 0.4;
const MINT_START = 0.8;
const STACK_DONE = MINT_START + FALL + 0.3; // last coin has finished bouncing
const HOLD_END = STACK_DONE + 1.0; // the stack stays in place for one second, then it falls away
const CYCLE = HOLD_END + 0.06 + 0.55 + 0.3; // last coin leaves the bottom, short empty beat, repeat

// Bottom to top: each coin waits above the viewBox until its turn.
const COINS: { id: string; d: string; color: string; track: Point[] }[] = [
  {
    id: "indigo",
    d: "M8 36H40",
    color: "var(--logo-indigo)",
    track: [
      ...landing(0, FALL, 5, 0, 0),
      ...press(SKY_START + FALL, 1.2),
      ...press(MINT_START + FALL, 1.6),
      ...fallAway(HOLD_END),
    ],
  },
  {
    id: "sky",
    d: "M8 24H40",
    color: "var(--logo-sky)",
    track: [
      { t: 0, y: START_OFFSET, rot: 6, x: 0, ease: "linear" },
      ...landing(SKY_START, FALL, 5, 6, 0),
      ...press(MINT_START + FALL, 1.2),
      ...fallAway(HOLD_END + 0.03),
    ],
  },
  {
    id: "mint",
    d: "M13 12H35",
    color: "var(--logo-mint)",
    track: [
      { t: 0, y: START_OFFSET, rot: -8, x: -2, ease: "linear" },
      ...landing(MINT_START, FALL, 5, -8, -2),
      ...fallAway(HOLD_END + 0.06),
    ],
  },
];

function pct(t: number) {
  return Math.round((t / CYCLE) * 10000) / 100;
}

function keyframes(id: string, track: Point[]): string {
  // later points win when two share a timestamp; keep them in time order
  const sorted = [...track].sort((a, b) => a.t - b.t);
  const frames = sorted.map((p, i) => {
    const prev = sorted[i - 1];
    const x = p.x ?? prev?.x ?? 0;
    const rot = p.rot ?? prev?.rot ?? 0;
    p.x = x;
    p.rot = rot;
    return `${pct(p.t)}% { transform: translate(${x}px, ${p.y}px) rotate(${rot}deg); animation-timing-function: ${EASING[p.ease ?? "linear"]}; }`;
  });
  const last = sorted[sorted.length - 1];
  frames.push(`100% { transform: translate(0px, ${last.y}px) rotate(0deg); }`);
  return `@keyframes coin-loader-${id} { ${frames.join(" ")} }`;
}

const CSS = `
${COINS.map((c) => keyframes(c.id, c.track)).join("\n")}
.coin-loader-coin { transform-box: fill-box; transform-origin: center; animation-duration: ${CYCLE}s; animation-iteration-count: infinite; animation-fill-mode: both; }
${COINS.map((c) => `.coin-loader-${c.id} { animation-name: coin-loader-${c.id}; }`).join("\n")}
@media (prefers-reduced-motion: reduce) {
  .coin-loader-coin { animation: none; transform: none; }
}
`;

export function CoinLoader({ size = 40 }: { size?: number }) {
  return (
    <>
      <style>{CSS}</style>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        strokeWidth={12}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ overflow: "hidden" }}
      >
        {COINS.map((c) => (
          <path key={c.id} d={c.d} className={`coin-loader-coin coin-loader-${c.id}`} style={{ stroke: c.color }} />
        ))}
      </svg>
    </>
  );
}
