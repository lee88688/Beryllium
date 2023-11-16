import { prisma } from "y/server/db";
import { createFailRes, createSuccessRes } from "y/utils/apiResponse";
import { type NextApiHandler } from "next";
import { withIronSessionApiRoute } from "iron-session/next";
import { ironOptions } from "y/config";

export interface LoginParam {
  username: string;
  password: string;
}

// TODO: password should encrypt
const handler: NextApiHandler = async (req, res) => {
  const data = req.body as LoginParam;
  const user = await prisma.user.findFirst({
    where: { username: data.username, password: data.password },
    select: {
      id: true,
    },
  });

  if (!user) {
    return createFailRes(res, "email or password may not be correct");
  }

  req.session.user = user;
  await req.session.save();

  return createSuccessRes(res, null);
};

export default withIronSessionApiRoute(handler, ironOptions);
