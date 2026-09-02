import Link from "next/link";

export default function Home() {
  return (
    <main style={{ maxWidth: 480, margin: "4rem auto", padding: "0 1rem" }}>
      <h1>Expense Tracker</h1>
      <p>
        <Link href="/login">Log in</Link> or <Link href="/signup">sign up</Link> to get started.
      </p>
    </main>
  );
}
