import { prisma } from "../db";

export async function userHasBook(userId: number, bookId: number) {
  const count = await prisma.book.count({
    where: {
      userId,
      id: bookId,
    },
  });

  return count > 0;
}
