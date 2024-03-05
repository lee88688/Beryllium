import {
  type NextApiHandlerWithSession,
  withSessionRoute,
} from "y/server/wrap";
import { prisma } from "y/server/db";
import { createSuccessRes } from "y/utils/apiResponse";

export interface RemoveCategoryParam {
  id: number;
}

const handler: NextApiHandlerWithSession = async (req, res, session) => {
  const userId = session.user.id;
  const data = req.body as RemoveCategoryParam;
  await prisma.category.delete({ where: { id: data.id, userId } });
  return createSuccessRes(res, null);
};

export default withSessionRoute(handler);
