import type {
  GetServerSideProps,
  NextApiHandler,
  NextApiRequest,
  NextApiResponse,
} from "next";
import { type ZodError, type ZodTypeAny } from "zod";
import { createFailRes } from "y/utils/apiResponse";
import { getIronSession, type IronSession } from "iron-session";
import { ironOptions, type SessionData } from "y/config";
import { prisma } from "y/server/db";

export async function isAdmin(userId: number) {
  const user = await prisma.user.findFirst({ where: { id: userId } });
  return Boolean(user?.isAdmin);
}

export type NextApiHandlerWithSession = (
  req: NextApiRequest,
  res: NextApiResponse,
  session: IronSession<SessionData>,
) => ReturnType<NextApiHandler>;

export const withAdmin = (handler: NextApiHandler): NextApiHandler => {
  return async (req, res) => {
    const session = await getIronSession<SessionData>(req, res, ironOptions);
    const userId = session.user.id;
    if (!(await isAdmin(userId))) {
      return res.status(401).json({ isSuccess: false });
    }
    return handler(req, res);
  };
};

export const withValidateWithSession = <
  T extends ZodTypeAny,
  K extends ZodTypeAny,
>(
  handler: NextApiHandlerWithSession,
  options: {
    query?: T;
    body?: K;
  },
) => {
  const fn: NextApiHandlerWithSession = async (req, res, session) => {
    if (options.query) {
      try {
        await options.query.parseAsync(req.query);
      } catch (e) {
        const error = e as ZodError;
        return createFailRes(res, error.message, error.issues);
      }
    }

    if (options.body) {
      try {
        await options.body.parseAsync(req.body);
      } catch (e) {
        const error = e as ZodError;
        return createFailRes(res, error.message, error.issues);
      }
    }

    handler(req, res, session);
  };

  return fn;
};

export const withValidate = withValidateWithSession as unknown as <
  T extends ZodTypeAny,
  K extends ZodTypeAny,
>(
  handler: NextApiHandler,
  options: {
    query?: T;
    body?: K;
  },
) => NextApiHandler;

export function withSessionRoute(handler: NextApiHandlerWithSession) {
  const sessionCheckHandler: NextApiHandler = async (req, res) => {
    const session = await getIronSession<SessionData>(req, res, ironOptions);
    if (!session.user) {
      return res
        .status(401)
        .json({ isSuccess: false, message: "Unauthorized" });
    }
    return handler(req, res, session);
  };
  return sessionCheckHandler;
}

export function withSessionSsr<Props extends Record<string, unknown>>(
  handler: (
    params: Parameters<GetServerSideProps<Props>>[0],
    session: IronSession<SessionData>,
  ) => ReturnType<GetServerSideProps<Props>>,
) {
  const sessionCheckHandler: GetServerSideProps<Props> = async (params) => {
    const session = await getIronSession<SessionData>(
      params.req,
      params.res,
      ironOptions,
    );
    console.log("ssr session", session);
    if (!session.user) {
      return {
        redirect: {
          permanent: false,
          destination: "/login",
        },
      };
    }
    return handler(params, session);
  };
  return sessionCheckHandler;
}
