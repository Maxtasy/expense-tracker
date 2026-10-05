import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { isVerificationGracePeriodExpired } from "@/lib/verification";
import { deleteExpiredGuests } from "@/lib/guest";
import { DEFAULT_LOCALE, LOCALES } from "@/lib/locale";
import { isRateLimited, recordAttempt } from "@/lib/rate-limit";

// Thrown by authorize() below when a login is otherwise valid but the account's email verification
// grace period has expired -- lets src/app/login/actions.ts show a distinct message (and skip
// counting it as a rate-limited bad-credentials guess) instead of the generic invalid-credentials one.
export class EmailNotVerifiedError extends CredentialsSignin {
  code = "email_not_verified";
}

// Thrown by authorize() when the login/guest rate limit is hit. Rate limiting lives here (not in the
// calling Server Actions) because /api/auth/[...nextauth] exposes the same callbacks publicly.
export class TooManyAttemptsError extends CredentialsSignin {
  code = "too_many_attempts";
}

function clientIpFromRequest(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

// bcrypt hash of a random string, compared against when no real hash exists (timing equalisation).
const DUMMY_HASH = "$2b$10$i3FgPqHz0QODuO/RGHERfO9VTmpH8T6aHap9C6Iv.Z0dj67RrNhwi";

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
      authorize: async (credentials, request) => {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const ip = clientIpFromRequest(request);
        if (await isRateLimited("login", { email, ip })) {
          throw new TooManyAttemptsError();
        }

        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

        // Always run a bcrypt compare (guest accounts have no password, and an unknown email has
        // no user) so response time doesn't reveal whether the account exists.
        const passwordMatches = await compare(password, user?.passwordHash ?? DUMMY_HASH);
        if (!user || !user.passwordHash || !passwordMatches) {
          await recordAttempt("login", { email, ip });
          return null;
        }

        if (!user.emailVerifiedAt && isVerificationGracePeriodExpired(user.createdAt)) {
          throw new EmailNotVerifiedError();
        }

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
    // "Try without an account": creates the guest user right here, so there's no credential that
    // could be replayed to sign in as someone else's guest. Rate limited right here.
    Credentials({
      id: "guest",
      credentials: { locale: {} },
      authorize: async (credentials, request) => {
        const ip = clientIpFromRequest(request);
        if (await isRateLimited("guest", { ip })) {
          throw new TooManyAttemptsError();
        }
        await recordAttempt("guest", { ip });

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
