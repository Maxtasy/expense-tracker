import { AuthBrand } from "@/components/auth-brand";
import { getTranslations } from "next-intl/server";
import { isVerificationTokenValid } from "./verify-token";
import { ConfirmVerificationForm } from "./confirm-verification-form";
import { ResendVerificationForm } from "./resend-verification-form";
import { LocaleSwitcher } from "@/components/locale-switcher";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const t = await getTranslations("auth.verifyEmail");
  const valid = token ? await isVerificationTokenValid(token) : false;

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-4">
      <LocaleSwitcher className="absolute right-4 top-4" />
      <div className="w-full max-w-xs text-center">
        <AuthBrand centered />
        {valid && token ? (
          <ConfirmVerificationForm token={token} />
        ) : (
          <>
            <h1 className="mb-2 text-lg font-semibold text-fg">{t("invalidOrExpiredTitle")}</h1>
            <p className="mb-4 text-sm text-fg-muted">{t("invalidOrExpiredDescription")}</p>
            <ResendVerificationForm />
          </>
        )}
      </div>
    </main>
  );
}
