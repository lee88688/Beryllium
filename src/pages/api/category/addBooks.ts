import type { NextApiHandler } from "next";
import { withSessionRoute } from "y/config";
import { prisma } from "y/server/db";
import { createSuccessRes } from "y/utils/apiResponse";

export interface AddBooksToCategoryParams {
  bookId: number;
  categoryId: number;
}

const handler: NextApiHandler = async (req, res) => {
  const data = req.body as AddBooksToCategoryParams[];
  // fixme: if already add, do not add it
  for (const item of data) {
    await prisma.categoryBook.create({ data: item });
  }
  return createSuccessRes(res, null);
};

export default withSessionRoute(handler);
