import { createHash } from "node:crypto";
import { prisma } from "../db";
import { deleteEpubFile } from "./file";

export function getPasswordHash(password: string) {
  const hash = createHash("sha256");
  return hash.update(password).digest("hex");
}

export async function createUser(user: {
  username: string;
  password: string;
  isAdmin?: boolean;
}) {
  return prisma.user.create({
    data: {
      ...user,
      password: getPasswordHash(user.password),
      isAdmin: user.isAdmin ?? false,
    },
  });
}

export async function deleteUser(id: number) {
  const user = await prisma.user.findFirst({ where: { id } });
  if (!user) return;

  const books = await prisma.book.findMany({ where: { userId: id } });

  // delete category
  const categories = await prisma.category.findMany({ where: { userId: id } });
  const deleteCategoryBook = prisma.categoryBook.deleteMany({
    where: {
      categoryId: {
        in: categories.map((item) => item.id),
      },
    },
  });
  const deleteCategory = prisma.category.deleteMany({ where: { userId: id } });
  await prisma.$transaction([deleteCategoryBook, deleteCategory]);

  // delete books
  await prisma.book.deleteMany({ where: { userId: id } });

  // finally delete books
  for (const b of books) {
    await deleteEpubFile(b.fileName);
  }

  await prisma.user.delete({ where: { id } });
}

export async function isAdmin(userId: number) {
  const user = await prisma.user.findFirst({ where: { id: userId } });
  return Boolean(user?.isAdmin);
}
