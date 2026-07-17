import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      avatarUrl?: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: string;
    avatarUrl?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    avatarUrl?: string;
  }
}
