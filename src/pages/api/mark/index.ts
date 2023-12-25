import type { NextApiHandler } from "next";
import { withSessionRoute } from "y/server/wrap";
import { prisma } from "y/server/db";
import { createSuccessRes } from "y/utils/apiResponse";
import type * as Prisma from "@prisma/client";

export type GetMarkQuery = Partial<Pick<Prisma.Mark, "type" | "bookId">>;

const handler: NextApiHandler = async (req, res) => {
  const userId = req.session.user.id;
  const query = req.query as unknown as GetMarkQuery;
  if (query.bookId) {
    query.bookId = Number(query.bookId);
  }

  const marks = await prisma.mark.findMany({
    where: {
      ...query,
      userId,
    },
  });

  return createSuccessRes(res, marks);
};

export default withSessionRoute(handler);
