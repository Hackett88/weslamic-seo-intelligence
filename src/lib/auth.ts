import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "用户名", type: "text" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username as string;
        const password = credentials?.password as string;
        const envUser = process.env.ADMIN_USERNAME ?? "admin";
        // bcrypt hash of "weslamic2026" (cost=10, verified)
        const HASH = "$2b$10$/3uvv136nxQZOqFc./LZu.3t9IiuZBfZElxbA7zg/w1dlDM8WDInK";
        if (username !== envUser) return null;
        const valid = await bcrypt.compare(password, HASH);
        if (!valid) return null;
        return { id: "1", name: username, email: `${username}@weslamic.com` };
      },
    }),
  ],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
});
