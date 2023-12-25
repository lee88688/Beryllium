import type { NextApiHandler } from "next";
import { withSessionRoute } from "y/server/wrap";
import { createSuccessRes } from "y/utils/apiResponse";
import { withValidate } from "y/server/wrap";
import { z } from "zod";
import { prisma } from "y/server/db";

const passwordSchema = z.object({
  password: z.string().min(6),
});

export type PasswordParams = z.infer<typeof passwordSchema>;

const handler: NextApiHandler = async (req, res) => {
  const { password } = req.body as PasswordParams;
  const userId = req.session.user.id;

  await prisma.user.update({
    where: { id: userId },
    data: { password },
  });

  createSuccessRes(res, null);
};

export default withSessionRoute(
  withValidate(handler, { body: passwordSchema }),
);
