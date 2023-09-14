import type { NextApiHandler } from "next";
import { withSessionRoute } from "y/config";
import { prisma } from "y/server/db";
import { createSuccessRes } from "y/utils/apiResponse";

const handler: NextApiHandler = async (req, res) => {
  const data = req.body as number[];
  await prisma.categoryBook.deleteMany({ where: { id: { in: data } } });

  return createSuccessRes(res, null);
};

export default withSessionRoute(handler);
