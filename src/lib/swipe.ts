// Shared by the overview and Insights swipe navigation. A touch should only count as a month swipe
// when it isn't really a text edit/selection or a scroll of an inner horizontally-scrolling element.

function isInsideHorizontalScroller(el: Element | null): boolean {
  for (let node = el; node && node !== document.body; node = node.parentElement) {
    if (node.scrollWidth <= node.clientWidth) continue;
    const overflowX = getComputedStyle(node).overflowX;
    if (overflowX === "auto" || overflowX === "scroll") return true;
  }
  return false;
}

export function canStartSwipe(target: EventTarget): boolean {
  const el = target as Element;
  if (el.closest("dialog, input, textarea, select, [contenteditable='true']")) return false;
  return !isInsideHorizontalScroller(el);
}

// A drag across text selects it instead of navigating.
export function hasTextSelection(): boolean {
  return (window.getSelection()?.toString() ?? "") !== "";
}
