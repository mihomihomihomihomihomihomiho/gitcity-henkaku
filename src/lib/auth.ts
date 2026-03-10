import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getCsrfToken } from "next-auth/react";
import { SiweMessage } from "siwe";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Ethereum",
      credentials: {
        message: { label: "Message", type: "text" },
        signature: { label: "Signature", type: "text" },
      },
      async authorize(credentials, req) {
        try {
          const siwe = new SiweMessage(
            JSON.parse(credentials?.message ?? "{}")
          );

          const nextAuthUrl = new URL(
            process.env.NEXTAUTH_URL ?? "http://localhost:3000"
          );

          const result = await siwe.verify({
            signature: credentials?.signature ?? "",
            domain: nextAuthUrl.host,
            nonce: await getCsrfToken({ req: { headers: req?.headers } }),
          });

          if (result.success) {
            return { id: siwe.address };
          }
          return null;
        } catch {
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async session({ session, token }) {
      // session.addressにwallet addressを追加
      (session as unknown as Record<string, unknown>).address = token.sub;
      return session;
    },
  },
};
