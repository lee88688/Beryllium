import type { NextApiHandler } from "next";
import { isAdmin } from "./service/user";
import { type ZodTypeAny, type ZodError } from "zod";
import { createFailRes } from "y/utils/apiResponse";

export const withAdmin = (handler: NextApiHandler): NextApiHandler => {
  const fn: NextApiHandler = async (req, res) => {
    const userId = req.session.user.id;
    if (!(await isAdmin(userId))) {
      return res.status(401).json({ isSuccess: false });
    }
    return handler(req, res);
  };

  return fn;
};

export const withValidate = <T extends ZodTypeAny, K extends ZodTypeAny>(
  handler: NextApiHandler,
  options: {
    query?: T;
    body?: K;
  },
) => {
  const fn: NextApiHandler = async (req, res) => {
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

    handler(req, res);
  };

  return fn;
};
