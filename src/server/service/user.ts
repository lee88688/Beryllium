import { prisma } from "../db";

export async function createUser(user: { email: string; password: string }) {
  return prisma.user.create({ data: user });
}
