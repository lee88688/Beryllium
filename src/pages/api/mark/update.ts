import type { NextApiHandler } from "next";
import { withSessionRoute } from "y/server/wrap";
import { prisma } from "y/server/db";
import { createFailRes, createSuccessRes } from "y/utils/apiResponse";
import type * as Prisma from "@prisma/client";
import omit from "lodash/omit";
import { userHasMark } from "y/server/service/mark";

export type UpdateMarkParams = Pick<Prisma.Mark, "id"> &
  Partial<Omit<Prisma.Mark, "id" | "bookId" | "userId">>;

const handler: NextApiHandler = async (req, res) => {
  const userId = req.session.user.id;
  const params = req.body as UpdateMarkParams;

  if (!(await userHasMark(userId, params.id))) {
    return createFailRes(res, "book is not found");
  }

  await prisma.mark.update({
    where: {
      id: params.id,
      userId,
    },
    data: omit(params, "id"),
  });

  return createSuccessRes(res, null);
};

export default withSessionRoute(handler);
