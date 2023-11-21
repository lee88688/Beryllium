import type { NextApiHandler } from "next";
import { withSessionRoute } from "y/server/wrap";
import { prisma } from "y/server/db";
import { createFailRes, createSuccessRes } from "y/utils/apiResponse";

const handler: NextApiHandler = async (req, res) => {
  const userId = req.session.user.id;
  const bookId = Number.parseInt(req.query.current as string);

  const book = await prisma.book.findFirst({
    select: {
      current: true,
    },
    where: {
      id: bookId,
      userId,
    },
  });

  if (!book) {
    return createFailRes(res, "book is not found!");
  }

  return createSuccessRes(res, book.current);
};

export default withSessionRoute(handler);
