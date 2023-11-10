import type { NextApiHandler } from "next";
import { withSessionRoute } from "y/config";
import { createSuccessRes } from "y/utils/apiResponse";
import { withAdmin, withValidate } from "y/server/wrap";
import { z } from "zod";
import { createUser } from "y/server/service/user";

const createUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(6),
});

export type CreateUserParams = z.infer<typeof createUserSchema>;

const handler: NextApiHandler = async (req, res) => {
  const newUser = req.body as CreateUserParams;

  await createUser(newUser);

  createSuccessRes(res, null);
};

export default withSessionRoute(
  withAdmin(withValidate(handler, { body: createUserSchema })),
);
