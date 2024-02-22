import {
  type NextApiHandlerWithSession,
  withSessionRoute,
  withValidateWithSession,
} from "y/server/wrap";
import { createSuccessRes } from "y/utils/apiResponse";
import { z } from "zod";
import { prisma } from "y/server/db";

const passwordSchema = z.object({
  password: z.string().min(6),
});

export type PasswordParams = z.infer<typeof passwordSchema>;

const handler: NextApiHandlerWithSession = async (req, res, session) => {
  const { password } = req.body as PasswordParams;
  const userId = session.user.id;

  await prisma.user.update({
    where: { id: userId },
    data: { password },
  });

  createSuccessRes(res, null);
};

export default withSessionRoute(
  withValidateWithSession(handler, { body: passwordSchema }),
);
