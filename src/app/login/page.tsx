import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string; guest?: string; deleted?: string }>;
}) {
  const { reset, guest, deleted } = await searchParams;
  return <LoginForm resetSuccess={reset === "success"} guestExpired={guest === "expired"} accountDeleted={deleted === "1"} />;
}
