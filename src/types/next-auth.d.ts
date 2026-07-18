import { DefaultSession, DefaultUser } from "next-auth";
import { UserRoleType, UserStatusType } from "@/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRoleType;
      status: UserStatusType;
      avatarUrl?: string;
      needPasswordChange?: boolean;
      sessionToken?: string;
      mobileNumber?: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: UserRoleType;
    status: UserStatusType;
    avatarUrl?: string;
    needPasswordChange?: boolean;
    sessionToken?: string;
    mobileNumber?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRoleType;
    status: UserStatusType;
    avatarUrl?: string;
    needPasswordChange?: boolean;
    sessionToken?: string;
    mobileNumber?: string;
  }
}
