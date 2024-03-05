import {
  type NextApiHandlerWithSession,
  withSessionRoute,
} from "y/server/wrap";
import { prisma } from "y/server/db";
import { createSuccessRes } from "y/utils/apiResponse";

const handler: NextApiHandlerWithSession = async (req, res, session) => {
  const { user } = session;
  const { category } = req.query;
  const books = await prisma.book.findMany({
    where: {
      userId: user.id,
      categoryBook: category
        ? {
            some: {
              categoryId: {
                equals: Number.parseInt(category as string),
              },
            },
          }
        : undefined,
    },
  });
  createSuccessRes(res, books);
};

export default withSessionRoute(handler);
