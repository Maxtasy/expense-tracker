"use client";

import { useEffect, useRef, useState } from "react";

// Silent looping product teaser. Autoplays muted; for visitors who prefer reduced motion it
// stays paused with native controls instead. Tapping the video toggles pause otherwise, so
// there's always a way to stop it.
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
    <div
      style={{ width: "100%", maxWidth: 240, margin: "0 auto", borderRadius: "1.75rem", overflow: "hidden" }}
      className="border border-border shadow-2xl shadow-black/40"
    >
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
        style={{ display: "block", width: "100%", height: "auto", aspectRatio: "390 / 844" }}
      >
        <source src="/media/teaser.webm" type="video/webm" />
        <source src="/media/teaser.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
