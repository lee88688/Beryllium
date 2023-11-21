import type { NextApiHandler } from "next";
import { withSessionRoute } from "y/server/wrap";
import { createSuccessRes } from "y/utils/apiResponse";
import { withAdmin, withValidate } from "y/server/wrap";
import { z } from "zod";
import { deleteUser } from "y/server/service/user";

const destroyUserSchema = z.object({
  userId: z.number(),
});

export type DeleteUserParams = z.infer<typeof destroyUserSchema>;

const handler: NextApiHandler = async (req, res) => {
  const { userId } = req.body as DeleteUserParams;

  await deleteUser(userId);

  createSuccessRes(res, null);
};

export default withSessionRoute(
  withAdmin(withValidate(handler, { body: destroyUserSchema })),
);
