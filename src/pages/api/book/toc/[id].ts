import type { NextApiHandler } from "next";
import { withSessionRoute } from "y/config";
import { getTocPath, prisma } from "y/server/db";
import { parseToc } from "y/server/service/epub";
import { asarFileDir, readAsarFile } from "y/server/service/file";
import { createFailRes, createSuccessRes } from "y/utils/apiResponse";

const handler: NextApiHandler = async (req, res) => {
  const userId = req.session.user.id;
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
  const { href } = getTocPath(book);
  const buffer = await readAsarFile(asarFileDir(book.fileName), href);
  const toc = await parseToc(buffer.toString("utf8"));

  return createSuccessRes(res, toc);
};

export default withSessionRoute(handler);
