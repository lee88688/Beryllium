import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z.enum(["development", "test", "production"]),
    ASAR_DIR: z.string(),
    TEMP_DIR: z.string(),
    ADMIN_USER_NAME: z.string().min(1),
    ADMIN_USER_PASSWORD: z.string().min(6),
    SESSION_SECRET: z.string().min(32),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string().min(1),
  },

  // https://env.t3.gg/docs/nextjs#create-your-schema
  // runtimeEnv: {
  //   DATABASE_URL: process.env.DATABASE_URL,
  //   NODE_ENV: process.env.NODE_ENV,
  //   ASAR_DIR: process.env.ASAR_DIR,
  //   TEMP_DIR: process.env.TEMP_DIR,
  //   // NEXT_PUBLIC_CLIENTVAR: process.env.NEXT_PUBLIC_CLIENTVAR,
  // },
  experimental__runtimeEnv: {},

  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
   * This is especially useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
