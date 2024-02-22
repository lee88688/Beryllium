import type { SessionOptions } from "iron-session";
import type { LRUCache } from "lru-cache";
import { type EasyAsar } from "asar-async";
import { env } from "y/env.mjs";

export interface SessionData {
  user: {
    id: number;
  };
}

export const ironOptions: SessionOptions = {
  cookieName: "sealed",
  password: env.SESSION_SECRET,
  // secure: true should be used in production (HTTPS) but can't be used in development (HTTP)
  cookieOptions: {
    secure: false,
  },
};

export const asarDir = env.ASAR_DIR;
export const tempDir = env.TEMP_DIR;

export const lruOptions: LRUCache.Options<string, EasyAsar, unknown> = {
  max: 500,
  allowStale: true,
  updateAgeOnGet: true,
  updateAgeOnHas: true,
};
