import { prisma } from "../db";

export async function userHasMark(userId: number, markId: number) {
  const count = await prisma.mark.count({
    where: {
      userId,
      id: markId,
    },
  });

  return count > 0;
}
