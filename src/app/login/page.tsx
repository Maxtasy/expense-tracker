import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string; guest?: string }>;
}) {
  const { reset, guest } = await searchParams;
  return <LoginForm resetSuccess={reset === "success"} guestExpired={guest === "expired"} />;
}
