import { getUserSettingsRow } from "@/lib/user-settings-server";
import { DEFAULT_CURRENCY } from "@/lib/currency";

export async function getUserCurrency(userId: string): Promise<string> {
  const row = await getUserSettingsRow(userId);
  return row?.currency ?? DEFAULT_CURRENCY;
}
