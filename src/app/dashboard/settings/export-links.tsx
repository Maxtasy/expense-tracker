"use client";

import { Download } from "lucide-react";

export function ExportLinks({ links }: { links: { href: string; label: string }[] }) {
  return (
    <div className="flex flex-col gap-2">
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          download
          onClick={(e) => {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            e.currentTarget.href = `${link.href}?tz=${encodeURIComponent(tz)}`;
          }}
          className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg hover:bg-surface-hover"
        >
          {link.label}
          <Download size={16} className="text-fg-muted" />
        </a>
      ))}
    </div>
  );
}
