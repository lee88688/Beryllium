import type { IronSessionOptions } from "iron-session";
import { env } from "y/env.mjs";

declare module "iron-session" {
  interface IronSessionData {
    user: {
      id: number;
    };
  }
}

export const ironOptions: IronSessionOptions = {
  cookieName: "sealed",
  password: "complex_password_at_least_32_characters_long",
  // secure: true should be used in production (HTTPS) but can't be used in development (HTTP)
  //   cookieOptions: {
  //     secure: process.env.NODE_ENV === "production",
  //   },
};

export const asarDir = env.ASAR_DIR;
export const tempDir = env.TEMP_DIR;
