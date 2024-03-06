import type { TypeOf, ZodTypeAny } from "zod";
import { getIronSession, type IronSession } from "iron-session";
import { ironOptions, type SessionData } from "y/config";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export function withSessionAction<
  Z extends ZodTypeAny,
  H extends (params: TypeOf<Z>, session: IronSession<SessionData>) => unknown,
>(schema: Z | null, handler: H) {
  return async function action(params: TypeOf<Z>) {
    const session = await getIronSession<SessionData>(cookies(), ironOptions);
    if (!session.user) {
      return { isSuccess: false, message: "Unauthorized" };
    }

    const parsedParams = (await schema?.parseAsync(params)) as
      | TypeOf<Z>
      | undefined;

    const data = handler(parsedParams ?? params, session);

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
