"use client";

import { createContext, useContext } from "react";
import { DEFAULT_DATE_FORMAT } from "@/lib/date-format";

const DateFormatContext = createContext<string>(DEFAULT_DATE_FORMAT);

// Hands the user's date-format setting (see src/lib/date-format.ts) to every DateInput below it.
export function DateFormatProvider({ dateFormat, children }: { dateFormat: string; children: React.ReactNode }) {
  return <DateFormatContext.Provider value={dateFormat}>{children}</DateFormatContext.Provider>;
}

export const useDateFormat = () => useContext(DateFormatContext);
