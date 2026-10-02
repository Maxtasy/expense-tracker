"use client";

import { useEffect, useRef, useState } from "react";

// Silent looping product teaser (styled by .lp-video in src/app/landing.css). Autoplays muted;
// for visitors who prefer reduced motion it stays paused with native controls instead. Tapping
// the video toggles pause otherwise, so there's always a way to stop it.
export function TeaserVideo({ label }: { label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads a browser-only media query once on mount
    setReducedMotion(reduced);
    if (!reduced) ref.current?.play().catch(() => {});
  }, []);

  function toggle() {
    const video = ref.current;
    if (!video || reducedMotion) return;
    if (video.paused) void video.play();
    else video.pause();
  }

  return (
    <div className="lp-video">
      <video
        ref={ref}
        muted
        loop
        playsInline
        preload="metadata"
        controls={reducedMotion}
        poster="/media/teaser-poster.jpg"
        aria-label={label}
        onClick={toggle}
      >
        <source src="/media/teaser.webm" type="video/webm" />
        <source src="/media/teaser.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
