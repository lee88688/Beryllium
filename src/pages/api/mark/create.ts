import type { NextApiHandler } from "next";
import { withSessionRoute } from "y/config";
import { prisma } from "y/server/db";
import { createFailRes, createSuccessRes } from "y/utils/apiResponse";
import type * as Prisma from "@prisma/client";
import { userHasBook } from "y/server/service/book";

export type CreateMarkParams = Omit<Prisma.Mark, "id">;

const handler: NextApiHandler = async (req, res) => {
  const params = req.body as CreateMarkParams;
  const userId = req.session.user.id;

  if (!(await userHasBook(userId, params.bookId))) {
    createFailRes(res, "book is not found!");
    return;
  }

  await prisma.mark.create({
    data: params,
  });

  createSuccessRes(res, null);
};

export default withSessionRoute(handler);
