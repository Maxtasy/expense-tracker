import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { getVerificationStatus } from "@/lib/verification";
import { ChangePasswordForm } from "../change-password-form";
import { DeleteAccountForm } from "../delete-account-form";
import { LogoutSection } from "../logout-section";
import { SettingsPageHeader, SettingsSection } from "../settings-section";

export default async function AccountSettingsPage() {
  const session = await auth();
  if (!session?.user) return null;
  const [t, account] = await Promise.all([getTranslations("settings"), getVerificationStatus(session.user.id)]);
  const isGuest = account?.isGuest ?? false;

  return (
    <div>
      <SettingsPageHeader title={t("groups.account.title")} />

      {!isGuest && (
        <SettingsSection title={t("changePassword.label")}>
          <ChangePasswordForm />
        </SettingsSection>
      )}

      <SettingsSection title={t("logout.label")} description={isGuest ? t("logout.guestDescription") : t("logout.description")}>
        <LogoutSection isGuest={isGuest} />
      </SettingsSection>

      <SettingsSection title={t("deleteAccount.label")} description={t("deleteAccount.description")} danger>
        <DeleteAccountForm isGuest={isGuest} />
      </SettingsSection>
    </div>
  );
}
