import { prisma } from "y/server/db";
import { createFailRes, createSuccessRes } from "y/utils/apiResponse";
import { withSessionRoute } from "y/server/wrap";
import { type NextApiHandler } from "next";

export interface DeleteBookParam {
  id: number;
}

const handler: NextApiHandler = async (req, res) => {
  const userId = req.session.user.id;
  const param = req.body as DeleteBookParam;

  const book = await prisma.book.findFirst({
    where: {
      userId,
      id: param.id,
    },
  });
  if (!book) {
    createFailRes(res, "book id is not found!");
    return;
  }
  const deleteMark = prisma.mark.deleteMany({
    where: {
      bookId: param.id,
    },
  });
  const deleteCategoryBook = prisma.categoryBook.deleteMany({
    where: {
      bookId: param.id,
    },
  });
  const deleteBook = prisma.book.delete({ where: { id: param.id } });

  try {
    await prisma.$transaction([deleteMark, deleteCategoryBook, deleteBook]);
  } catch (e) {
    console.error(e);
    return createFailRes(res, "delete failed");
  }

  return createSuccessRes(res, null);
};

export default withSessionRoute(handler);
