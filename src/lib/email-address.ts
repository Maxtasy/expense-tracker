import { z } from "zod";

// Every email is stored and looked up trimmed + lowercased, so "A@x.com" and "a@x.com" are one
// account. Use this (or emailField) wherever an address enters the app.
export const normalizeEmail = (value: string) => value.trim().toLowerCase();

export const emailField = (invalidMsg: string) => z.string().trim().email(invalidMsg).transform((v) => v.toLowerCase());
