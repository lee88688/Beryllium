import type { NextApiHandler } from "next";
import { withSessionRoute } from "y/server/wrap";
import { prisma } from "y/server/db";
import { createSuccessRes } from "y/utils/apiResponse";

interface BookCurrentUpdateParam {
  current: string;
}

const handler: NextApiHandler = async (req, res) => {
  const userId = req.session.user.id;
  const bookId = Number.parseInt(req.query.current as string);
  const { current } = req.body as BookCurrentUpdateParam;

  await prisma.book.update({
    where: {
      id: bookId,
      userId,
    },
    data: {
      current,
    },
  });

  return createSuccessRes(res, null);
};

export default withSessionRoute(handler);
