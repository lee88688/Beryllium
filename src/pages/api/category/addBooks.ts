import type { NextApiHandler } from "next";
import { withSessionRoute } from "y/config";
import { prisma } from "y/server/db";
import { createSuccessRes } from "y/utils/apiResponse";

export interface AddBooksToCategoryDTO {
  bookId: number;
  categoryId: number;
}

const handler: NextApiHandler = async (req, res) => {
  const data = req.body as AddBooksToCategoryDTO[];
  for (const item of data) {
    await prisma.categoryBook.create({ data: item });
  }
  return createSuccessRes(res, null);
};

export default withSessionRoute(handler);
