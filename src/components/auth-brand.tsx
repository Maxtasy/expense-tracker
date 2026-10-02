import { Logo } from "@/components/logo";

// Brand lockup shown above the forms on the signed-out pages (login, signup, password reset, ...).
// Inline styles: layout-critical, and new Tailwind utilities can be dropped by the Turbopack dev
// server (see CLAUDE.md gotchas).
export function AuthBrand({ centered = false }: { centered?: boolean }) {
  return (
    <div
      className="font-semibold text-fg"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: centered ? "center" : "flex-start",
        gap: 10,
        marginBottom: 32,
        fontSize: 17,
        letterSpacing: "-0.02em",
      }}
    >
      <Logo size={24} />
      Expense Tracker
    </div>
  );
}
