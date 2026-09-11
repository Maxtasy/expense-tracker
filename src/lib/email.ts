import { Resend } from "resend";
import { createTranslator } from "next-intl";
import { LOCALES, DEFAULT_LOCALE } from "@/lib/locale";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MESSAGE_LOADERS: Record<string, () => Promise<any>> = {
  en: () => import("../../messages/en.json"),
  de: () => import("../../messages/de.json"),
  es: () => import("../../messages/es.json"),
  fr: () => import("../../messages/fr.json"),
  pt: () => import("../../messages/pt.json"),
};

async function getEmailTranslator(locale: string) {
  const resolvedLocale = LOCALES.some((l) => l.code === locale) ? locale : DEFAULT_LOCALE;
  const messages = (await MESSAGE_LOADERS[resolvedLocale]()).default;
  return createTranslator({ locale: resolvedLocale, messages, namespace: "email.passwordReset" });
}

function passwordResetHtml(t: Awaited<ReturnType<typeof getEmailTranslator>>, resetUrl: string) {
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;padding:32px;max-width:480px;">
            <tr>
              <td style="font-size:18px;font-weight:600;color:#111318;padding-bottom:16px;">${t("heading")}</td>
            </tr>
            <tr>
              <td style="font-size:14px;line-height:1.6;color:#3f4451;padding-bottom:24px;">${t("body")}</td>
            </tr>
            <tr>
              <td style="padding-bottom:24px;">
                <a href="${resetUrl}" style="display:inline-block;background-color:#4f46e5;color:#f5f5ff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 20px;border-radius:8px;">${t("button")}</a>
              </td>
            </tr>
            <tr>
              <td style="font-size:12px;line-height:1.6;color:#8890a3;">${t("ignoreNote")}</td>
            </tr>
            <tr>
              <td style="font-size:12px;color:#8890a3;padding-top:24px;border-top:1px solid #eceef2;margin-top:24px;">${t("footer")}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendPasswordResetEmail(email: string, resetUrl: string, locale: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    throw new Error("RESEND_API_KEY and RESEND_FROM_EMAIL must be set to send emails");
  }

  const t = await getEmailTranslator(locale);
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: email,
    subject: t("subject"),
    html: passwordResetHtml(t, resetUrl),
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}
