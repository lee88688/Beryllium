import type { NextApiHandler } from "next";
import { withSessionRoute } from "y/config";
import { createSuccessRes } from "y/utils/apiResponse";
import { withAdmin } from "y/server/wrap";
import { prisma } from "y/server/db";
import pick from "lodash/pick";

const handler: NextApiHandler = async (req, res) => {
  const users = await prisma.user.findMany({});

  createSuccessRes(
    res,
    users.map((item) => pick(item, "id", "username", "isAdmin")),
  );
};

export default withSessionRoute(withAdmin(handler));
