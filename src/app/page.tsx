import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-semibold text-fg">Expense Tracker</h1>
      <p className="text-sm text-fg-muted">
        <Link href="/login" className="text-accent hover:text-accent-hover">
          Log in
        </Link>{" "}
        or{" "}
        <Link href="/signup" className="text-accent hover:text-accent-hover">
          sign up
        </Link>{" "}
        to get started.
      </p>
    </main>
  );
}
