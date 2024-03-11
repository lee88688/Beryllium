import "server-only";
import type { TypeOf, ZodTypeAny } from "zod";
import { ZodError } from "zod";
import { getIronSession, type IronSession } from "iron-session";
import { ironOptions, type SessionData } from "y/config";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { RequestError, type UnwrapPromise } from "y/interface";

export function withSessionAction<
  H extends (params: null, session: IronSession<SessionData>) => unknown,
>(
  schema: null,
  handler: H,
): () => Promise<{ isSuccess: true; data: UnwrapPromise<ReturnType<H>> }>;

export function withSessionAction<
  Z extends ZodTypeAny,
  H extends (params: TypeOf<Z>, session: IronSession<SessionData>) => unknown,
>(
  schema: Z,
  handler: H,
): (
  params: TypeOf<Z>,
) => Promise<{ isSuccess: true; data: UnwrapPromise<ReturnType<H>> }>;

export function withSessionAction<
  Z extends ZodTypeAny,
  H extends (params: TypeOf<Z>, session: IronSession<SessionData>) => unknown,
>(schema: Z | null, handler: H) {
  return async function action(params: TypeOf<Z>) {
    const session = await getIronSession<SessionData>(cookies(), ironOptions);
    if (!session.user) {
      return { isSuccess: false, message: "Unauthorized" };
    }

    let data;
    try {
      const parsedParams = (await schema?.parseAsync(
        params,
      )) as TypeOf<Z> | null;
      data = await handler(parsedParams ?? params, session);
    } catch (e) {
      // ZodError and RequestError need to be transferred to client
      if (e instanceof ZodError) {
        return {
          isSuccess: false,
          data: undefined,
          message: e.errors[0]?.message ?? "",
          error: e.errors,
        };
      } else if (e instanceof RequestError) {
        return {
          isSuccess: false,
          data: undefined,
          message: e.message,
          error: e.error,
        };
      }
    }

    return { isSuccess: true, data };
  };
}

export async function auth() {
  const session = await getIronSession<SessionData>(cookies(), ironOptions);
  if (!session.user) {
    redirect("/login");
  }

  return session;
}
