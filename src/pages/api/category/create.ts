import type { NextApiHandler } from "next";
import { withSessionRoute } from "y/config";
import { prisma } from "y/server/db";
import { createSuccessRes } from "y/utils/apiResponse";

export interface CreateCategoryParam {
  name: string;
  userId: number;
}

const handler: NextApiHandler = async (req, res) => {
  const data = req.body as CreateCategoryParam;
  await prisma.category.create({
    data: { name: data.name, userId: data.userId },
  });
  return createSuccessRes(res, null);
};

export default withSessionRoute(handler);
