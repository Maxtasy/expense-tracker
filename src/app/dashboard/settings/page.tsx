import { Download } from "lucide-react";
import { ImportForm } from "./import-form";

const exportLinks = [
  { href: "/dashboard/settings/export/categories", label: "categories.csv" },
  { href: "/dashboard/settings/export/recurring-transactions", label: "recurring_transactions.csv" },
  { href: "/dashboard/settings/export/transactions", label: "transactions.csv" },
];

export default function SettingsPage() {
  return (
    <div>
      <h1 className="mb-3 text-sm font-semibold text-fg">Settings</h1>

      <h2 className="mb-1.5 text-xs font-medium text-fg-muted">Export</h2>
      <div className="mb-4 rounded-xl border border-border bg-surface/30 p-3">
        <div className="flex flex-col gap-2">
          {exportLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              download
              className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg hover:bg-surface-hover"
            >
              {link.label}
              <Download size={16} className="text-fg-muted" />
            </a>
          ))}
        </div>
      </div>

      <h2 className="mb-1.5 text-xs font-medium text-fg-muted">Import</h2>
      <div className="rounded-xl border border-border bg-surface/30 p-3">
        <p className="mb-3 text-xs text-fg-muted">
          Import all three CSV files together. This replaces all of your categories, recurring transactions, and
          transactions with the contents of the files.
        </p>
        <ImportForm />
      </div>
    </div>
  );
}
