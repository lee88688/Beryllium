import { prisma } from "y/server/db";
import { createFailRes, createSuccessRes } from "y/utils/apiResponse";
import { type NextApiHandler } from "next";
import { getIronSession } from "iron-session";
import { ironOptions, type SessionData } from "y/config";
import { getPasswordHash } from "y/server/service/user";

export interface LoginParam {
  username: string;
  password: string;
}

const handler: NextApiHandler = async (req, res) => {
  const data = req.body as LoginParam;
  const password = getPasswordHash(data.password);
  const user = await prisma.user.findFirst({
    where: { username: data.username, password },
    select: {
      id: true,
    },
  });

  if (!user) {
    return createFailRes(res, "email or password may not be correct");
  }

  const session = await getIronSession<SessionData>(req, res, ironOptions);
  session.user = user;
  // (session as unknown as Record<string, unknown>).id = user.id;
  await session.save();

  return createSuccessRes(res, null);
};

export default handler;
