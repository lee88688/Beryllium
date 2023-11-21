import { prisma } from "y/server/db";
// env check
import { env } from "y/env.mjs";
import { createUser } from "y/server/service/user";

export default async function startup() {
  const adminUser = await prisma.user.findFirst({ where: { isAdmin: true } });
  if (!adminUser) return;

  await createUser({
    username: env.ADMIN_USER_NAME,
    password: env.ADMIN_USER_PASSWORD,
    isAdmin: true,
  });
}
