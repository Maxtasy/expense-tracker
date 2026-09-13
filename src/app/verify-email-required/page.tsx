import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { getVerificationStatus, isVerificationGracePeriodExpired } from "@/lib/verification";
import { logout } from "@/app/dashboard/actions";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ResendButton } from "./resend-button";

export default async function VerifyEmailRequiredPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const verification = await getVerificationStatus(session.user.id);
  const stillBlocked = verification && !verification.emailVerifiedAt && isVerificationGracePeriodExpired(verification.createdAt);
  if (!stillBlocked) {
    redirect("/dashboard");
  }

  const t = await getTranslations("auth.verifyEmailRequired");

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-4">
      <LocaleSwitcher className="absolute right-4 top-4" />
      <div className="w-full max-w-xs space-y-4 text-center">
        <div>
          <h1 className="mb-2 text-lg font-semibold text-fg">{t("title")}</h1>
          <p className="text-sm text-fg-muted">{t("description", { email: verification.email })}</p>
        </div>
        <ResendButton email={verification.email} />
        <form action={logout}>
          <button type="submit" className="text-sm text-accent hover:text-accent-hover">
            {t("logOut")}
          </button>
        </form>
      </div>
    </main>
  );
}
