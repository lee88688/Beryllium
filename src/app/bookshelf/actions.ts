"use server";

import { withSessionAction } from "y/server/wrapAppRouter";
import { prisma } from "y/server/db";
import * as z from "zod";

// --- book ----

export const getBook = withSessionAction(null, async function (_, session) {
  return await prisma.book.findMany({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
      title: true,
      author: true,
      description: true,
      cover: true,
      fileName: true,
    },
  });
});

export const deleteBook = withSessionAction(
  z.object({ id: z.number() }),
  async ({ id }, session) => {
    const userId = session.user.id;

    const book = await prisma.book.findFirst({
      where: {
        userId,
        id,
      },
    });
    if (!book) {
      throw new Error("book id is not found!");
    }
    const deleteMark = prisma.mark.deleteMany({
      where: {
        bookId: id,
      },
    });
    const deleteCategoryBook = prisma.categoryBook.deleteMany({
      where: {
        bookId: id,
      },
    });
    const deleteBook = prisma.book.delete({ where: { id: id } });

    try {
      await prisma.$transaction([deleteMark, deleteCategoryBook, deleteBook]);
    } catch (e) {
      console.error(e);
      throw e;
    }
  },
);

// --- category ---

export const getCategory = withSessionAction(null, async (_, session) => {
  return await prisma.category.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      categoryBook: {
        include: {
          book: true,
        },
      },
    },
  });
});

export const createCategory = withSessionAction(
  z.object({ name: z.string() }),
  async ({ name }, session) => {
    const userId = session.user.id;
    const existCategory = await prisma.category.findFirst({
      where: {
        userId,
        name,
      },
    });
    if (existCategory) {
      throw new Error(`name ${name} has existed!`);
    }

    await prisma.category.create({
      data: { name, userId },
    });
  },
);

export const removeCategory = withSessionAction(
  z.object({ id: z.number() }),
  async function ({ id }, session) {
    const userId = session.user.id;
    await prisma.category.delete({ where: { id, userId } });
  },
);

export const addBooksToCategory = withSessionAction(
  z.array(
    z.object({
      bookId: z.number(),
      categoryId: z.number(),
    }),
  ),
  async function (data) {
    for (const item of data) {
      await prisma.categoryBook.create({ data: item });
    }
  },
);

export const removeBooksFromCategory = withSessionAction(
  z.object({
    categoryId: z.number(),
    bookIds: z.array(z.number()),
  }),
  async (data) => {
    await prisma.categoryBook.deleteMany({
      where: {
        AND: [
          { categoryId: data.categoryId },
          { bookId: { in: data.bookIds } },
        ],
      },
    });
  },
);

// --- user ---
export const logout = withSessionAction(null, async (_, session) => {
  session.destroy;
});
