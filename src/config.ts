import type { IronSessionOptions } from 'iron-session'
import type { NextApiHandler, GetServerSideProps } from 'next'
import { withIronSessionApiRoute, withIronSessionSsr } from 'iron-session/next'

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

export const asarDir = process.env.ASAR_DIR ?? '';
export const tempDir = process.env.TEMP_DIR ?? '';

export function withSessionRoute(handler: NextApiHandler) {
  return withIronSessionApiRoute(handler, ironOptions);
}

export function withSessionSsr<Props extends Record<string, unknown>>(handler: GetServerSideProps<Props>) {
  return withIronSessionSsr(handler, ironOptions);
}