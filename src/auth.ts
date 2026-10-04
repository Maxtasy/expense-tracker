import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { isVerificationGracePeriodExpired } from "@/lib/verification";
import { deleteExpiredGuests } from "@/lib/guest";
import { DEFAULT_LOCALE, LOCALES } from "@/lib/locale";

// Thrown by authorize() below when a login is otherwise valid but the account's email verification
// grace period has expired -- lets src/app/login/actions.ts show a distinct message (and skip
// counting it as a rate-limited bad-credentials guess) instead of the generic invalid-credentials one.
export class EmailNotVerifiedError extends CredentialsSignin {
  code = "email_not_verified";
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (!user) return null;

        // guest accounts have no password (and no email, so the lookup above can't match one anyway)
        if (!user.passwordHash) return null;

        const passwordMatches = await compare(password, user.passwordHash);
        if (!passwordMatches) return null;

        if (!user.emailVerifiedAt && isVerificationGracePeriodExpired(user.createdAt)) {
          throw new EmailNotVerifiedError();
        }

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
    // "Try without an account": creates the guest user right here, so there's no credential that
    // could be replayed to sign in as someone else's guest. Rate limiting happens in the calling
    // Server Action (src/app/guest/actions.ts).
    Credentials({
      id: "guest",
      credentials: { locale: {} },
      authorize: async (credentials) => {
        const requested = credentials?.locale;
        const locale = LOCALES.find((l) => l.code === requested)?.code ?? DEFAULT_LOCALE;

        await deleteExpiredGuests();
        const [user] = await db.insert(users).values({ isGuest: true, locale }).returning({ id: users.id });
        return { id: user.id, email: null, name: null };
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session: ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
