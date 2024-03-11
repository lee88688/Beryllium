"use server";

import { getPasswordHash } from "y/server/service/user";
import { prisma } from "y/server/db";
import { getIronSession } from "iron-session";
import { ironOptions, type SessionData } from "y/config";
import { cookies } from "next/headers";

import { RequestError } from "y/interface";

export async function loginAction(data: {
  username: string;
  password: string;
}) {
  const password = getPasswordHash(data.password);
  const user = await prisma.user.findFirst({
    where: { username: data.username, password },
    select: {
      id: true,
    },
  });

  if (!user) {
    throw new RequestError("email or password may not be correct");
  }

  const session = await getIronSession<SessionData>(cookies(), ironOptions);
  session.user = user;
  await session.save();
}
