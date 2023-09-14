import type { NextApiHandler } from "next";
import { withSessionRoute } from "y/config";
import { prisma } from "y/server/db";
import { createSuccessRes } from "y/utils/apiResponse";

export interface RemoveCategoryParam {
  id: number;
}

const handler: NextApiHandler = async (req, res) => {
  const data = req.body as RemoveCategoryParam;
  await prisma.category.delete({ where: { id: data.id } });
  return createSuccessRes(res, null);
};

export default withSessionRoute(handler);
