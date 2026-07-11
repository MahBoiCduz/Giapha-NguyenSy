import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { db, users } from "@/lib/db";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db),
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const { email, password } = credentials as {
          email: string;
          password: string;
        };

        try {
          const normalizedEmail = email.toLowerCase().trim();

          // Find user by email
          const user = await db
            .select()
            .from(users)
            .where(eq(users.email, normalizedEmail))
            .get();

          if (!user) return null;

          // Look up credentials account for password hash
          const { accounts } = await import("@/lib/db/schema");
          const account = await db
            .select()
            .from(accounts)
            .where(eq(accounts.userId, user.id))
            .all();

          // Find the credentials provider account (stores pw hash in refresh_token)
          const credAccount = account.find(
            (a) => a.provider === "credentials"
          );

          if (!credAccount?.refresh_token) {
            return null; // No password set (Google-only user)
          }

          const isValid = await bcrypt.compare(
            password,
            credAccount.refresh_token
          );
          if (!isValid) return null;

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          };
        } catch (error) {
          console.error("Authorize error:", error);
          return null;
        }
      },
    }),
  ],
});

export { authConfig };
