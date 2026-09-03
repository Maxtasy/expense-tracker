const PALETTE = ["#38bdf8", "#34d399", "#fbbf24", "#a78bfa", "#f472b6", "#2dd4bf"];

export function categoryColor(name: string | null): string {
  if (!name) return "#5f5e5a";
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}
