import "server-only";
import { getTocPath, prisma } from "../db";
import type * as Prisma from "@prisma/client";
import { asarFileDir, readAsarFile } from "./file";
import { parseToc } from "./epub";
import { type NestedItemData } from "y/components/nestedList";

export async function userHasBook(userId: number, bookId: number) {
  const count = await prisma.book.count({
    where: {
      userId,
      id: bookId,
    },
  });

  return count > 0;
}

export async function getBookToc(
  book: Prisma.Book & { contentObject: any; contentMetadata: any },
) {
  const { href } = getTocPath(book);
  const buffer = await readAsarFile(asarFileDir(book.fileName), href);
  const toc = await parseToc(buffer.toString("utf8"));

  return toc as NestedItemData[];
}
