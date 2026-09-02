import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { logout } from "./actions";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main style={{ maxWidth: 480, margin: "4rem auto", padding: "0 1rem" }}>
      <h1>Dashboard</h1>
      <p>Logged in as {session.user.email}</p>
      <p>Expenses go here (Milestone 5).</p>
      <form action={logout}>
        <button type="submit">Log out</button>
      </form>
    </main>
  );
}
