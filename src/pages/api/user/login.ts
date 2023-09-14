import { prisma } from "y/server/db";
import { createFailRes, createSuccessRes } from "y/utils/apiResponse";
import { withSessionRoute } from "y/config";

export interface LoginParam {
  email: string;
  password: string;
}

// TODO: password should encrypt
export default withSessionRoute(async function handler(req, res) {
  const data = req.body as LoginParam;
  const user = await prisma.user.findFirst({
    where: { email: data.email, password: data.password },
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
});
