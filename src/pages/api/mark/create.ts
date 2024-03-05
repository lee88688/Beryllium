import {
  type NextApiHandlerWithSession,
  withSessionRoute,
} from "y/server/wrap";
import { prisma } from "y/server/db";
import { createFailRes, createSuccessRes } from "y/utils/apiResponse";
import type * as Prisma from "@prisma/client";
import { userHasBook } from "y/server/service/book";

export type CreateMarkParams = Omit<Prisma.Mark, "id" | "userId">;

const handler: NextApiHandlerWithSession = async (req, res, session) => {
  const params = req.body as CreateMarkParams;
  const userId = session.user.id;

  if (!(await userHasBook(userId, params.bookId))) {
    createFailRes(res, "book is not found!");
    return;
  }

  const mark = await prisma.mark.create({
    data: { ...params, userId },
  });

  createSuccessRes(res, mark.id);
};

export default withSessionRoute(handler);
