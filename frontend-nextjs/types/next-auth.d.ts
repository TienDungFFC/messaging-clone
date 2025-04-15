import { User } from "@/types";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: User & {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
    };
    token?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    token?: string;
  }
}
