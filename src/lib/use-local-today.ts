"use client";

import { useSyncExternalStore } from "react";
import { localDateString } from "@/lib/timezone";

const subscribe = () => () => {};

// Today's date in the browser's timezone. The server snapshot is UTC; once hydrated the hook
// switches to the local date, and an input whose value the user hasn't touched follows it.
export function useLocalToday(): string {
  return useSyncExternalStore(subscribe, () => localDateString(), () => new Date().toISOString().slice(0, 10));
}
