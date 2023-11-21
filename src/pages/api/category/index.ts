import type { NextApiHandler } from "next";
import { withSessionRoute } from "y/server/wrap";
import { prisma } from "y/server/db";
import { createSuccessRes } from "y/utils/apiResponse";

const handler: NextApiHandler = async (req, res) => {
  const userId = req.session.user.id;

  const categories = await prisma.category.findMany({
    where: {
      userId,
    },
    include: {
      categoryBook: {
        include: {
          book: true,
        },
      },
    },
  });
  return createSuccessRes(res, categories);
};

export default withSessionRoute(handler);
