import {
  type NextApiHandlerWithSession,
  withSessionRoute,
} from "y/server/wrap";
import { prisma } from "y/server/db";
import { getBookToc } from "y/server/service/book";
import { createFailRes, createSuccessRes } from "y/utils/apiResponse";

const handler: NextApiHandlerWithSession = async (req, res, session) => {
  const userId = session.user.id;
  const bookId = Number.parseInt(req.query.id as string);
  // todo: Authentication for fileName and user
  const book = await prisma.book.findFirst({
    where: {
      id: bookId,
      userId,
    },
  });
  if (!book) {
    createFailRes(res, "book is not found!");
    return;
  }

  const toc = await getBookToc(book);

  return createSuccessRes(res, toc);
};

export default withSessionRoute(handler);
