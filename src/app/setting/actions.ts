"use server";

import { withSessionAction } from "y/server/wrapAppRouter";
import { createUser, deleteUser } from "y/server/service/user";
import * as z from "zod";
import { prisma } from "y/server/db";

export const addUser = withSessionAction(
  z.object({
    username: z.string().min(1),
    password: z.string().min(6),
  }),
  async function (params) {
    await createUser(params);
  },
);

export const removeUser = withSessionAction(
  z.object({
    userId: z.number().min(1),
  }),
  async function ({ userId }) {
    await deleteUser(userId);
  },
);

export const changePassword = withSessionAction(
  z.string().min(6),
  async function (password, session) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password },
    });
  },
);
