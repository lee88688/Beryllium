"use server";

import { withSessionAction } from "y/server/wrapAppRouter";
import * as z from "zod";
import { MarkType } from "y/utils/constants";
import { prisma } from "y/server/db";
import { userHasMark } from "y/server/service/mark";
import omit from "lodash/omit";
import { userHasBook } from "y/server/service/book";
import { RequestError } from "y/utils/request";

// --- marks ---

export const getMark = withSessionAction(
  z.object({
    bookId: z.number(),
    type: z.nativeEnum(MarkType),
  }),
  async (params, session) => {
    return await prisma.mark.findMany({
      where: {
        ...params,
        userId: session.user.id,
      },
    });
  },
);

export const removeMark = withSessionAction(
  z.object({ id: z.number() }),
  async ({ id }, session) => {
    const userId = session.user.id;

    if (!(await userHasMark(userId, id))) {
      throw new RequestError("book is not found");
    }

    await prisma.mark.delete({
      where: {
        id,
      },
    });
  },
);

export const updateMark = withSessionAction(
  z.object({
    id: z.number(),
    // todo: change type to enum type
    type: z.string().optional(),
    epubcfi: z.string().optional(),
    // todo: change color to enum type
    color: z.string().optional(),
    title: z.string().optional(),
    content: z.string().optional(),
    selectedString: z.string().optional(),
  }),
  async (params, session) => {
    const userId = session.user.id;
    if (!(await userHasMark(userId, params.id))) {
      throw new RequestError("book is not found");
    }

    await prisma.mark.update({
      where: {
        id: params.id,
        userId,
      },
      data: omit(params, "id"),
    });
  },
);

export const addMark = withSessionAction(
  z.object({
    // todo: change type to enum type
    type: z.string(),
    epubcfi: z.string(),
    // todo: change color to enum type
    color: z.string(),
    title: z.string(),
    content: z.string(),
    selectedString: z.string(),
    bookId: z.number(),
  }),
  async (params, session) => {
    const userId = session.user.id;

    if (!(await userHasBook(userId, params.bookId))) {
      throw new RequestError("book is not found!");
    }

    await prisma.mark.create({
      data: { ...params, userId },
    });
  },
);

// --- book ---

export const updateBookCurrent = withSessionAction(
  z.object({ bookId: z.number(), current: z.string() }),
  async ({ bookId, current }, session) => {
    const userId = session.user.id;

    await prisma.book.update({
      where: {
        id: bookId,
        userId,
      },
      data: {
        current,
      },
    });
  },
);
