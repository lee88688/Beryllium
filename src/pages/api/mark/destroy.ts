import type { NextApiHandler } from "next";
import { withSessionRoute } from "y/config";
import { prisma } from "y/server/db";
import { createFailRes, createSuccessRes } from "y/utils/apiResponse";
import { userHasMark } from "y/server/service/mark";

interface DestroyMarkParams {
  id: number;
}

const handler: NextApiHandler = async (req, res) => {
  const userId = req.session.user.id;
  const params = req.body as DestroyMarkParams;

  if (!(await userHasMark(userId, params.id))) {
    createFailRes(res, "book is not found");
    return;
  }

  await prisma.mark.delete({
    where: {
      id: params.id,
    },
  });

  return createSuccessRes(res, null);
};

export default withSessionRoute(handler);
