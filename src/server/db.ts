/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import * as path from "path";
import { PrismaClient } from "@prisma/client";
import type * as Prisma from "@prisma/client";
import { env } from "y/env.mjs";

// const globalForPrisma = globalThis as unknown as {
//   prisma: PrismaClient | undefined;
// };

export const prisma =
  // globalForPrisma.prisma ??
  new PrismaClient({
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })
    .$extends({
      result: {
        book: {
          contentObject: {
            needs: { content: true },
            compute(data) {
              return JSON.parse(data.content);
            },
          },
        },
      },
    })
    .$extends({
      result: {
        book: {
          contentMetadata: {
            needs: { contentObject: true },
            compute(data) {
              const { package: p } = data.contentObject ?? ({} as any);
              if (!p) return {};
              return p.metadata[0];
            },
          },
        },
      },
    });

// type Client = typeof prisma;

// if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

type Book = Prisma.Book & { contentObject: any; contentMetadata: any };

function getManifestItemFromId(book: Book, id: string) {
  const { contentObject: { package: p } = {} } = book;
  if (!p) return {};
  const manifest = p.manifest[0];
  const items: any[] = manifest.item || [];
  const item = items.find(({ $ }) => $.id === id);
  return item ? item.$ : null;
}

function getManifestItemHrefUrl(book: Book, href: string) {
  if (!book.contentPath) return "";
  const dir = path.dirname(book.contentPath);
  return path.join(dir, href);
}

function getMetaFromName(book: Book, name: string) {
  const metadata = book.contentMetadata;
  const meta: any[] = metadata.meta || [];
  const res = meta.find(({ $: { name: mName } }) => mName === name);
  if (!res) return null;
  return res.$.content;
}

function getMetadataFromKey(book: Book, key: string) {
  if (!key) {
    console.warn("model Book method(getMetadataFromKey) get empty key.");
    return "";
  }
  const metadata = book.contentMetadata;
  const internalKey = `dc:${key}`;
  const value: any[] = metadata[internalKey] || metadata[key] || [];
  /**
   * if xml item does not contain attributes(<tag>xxx</tag>), array item is just a string,
   * in contrast, array item is an object like ({ _: 'xxx', $: {} })
   */
  return value.length
    ? value.map((item) => (item._ ? item._ : item)).join(",")
    : "";
}

export function fillInBaseInfo(book: Book) {
  if (!book.content) {
    return;
  }
  book.title = getMetadataFromKey(book, "title");
  book.description = getMetadataFromKey(book, "description");
  book.author = getMetadataFromKey(book, "creator");
  const coverId = getMetaFromName(book, "cover") as string;
  const coverItem = getManifestItemFromId(book, coverId) as { href: string };
  book.cover = getManifestItemHrefUrl(book, coverItem.href);
}

export function getTocPath(book: Book) {
  // todo: support epub3 toc
  const {
    contentObject: { package: p },
  } = book;
  const spine = p.spine[0];
  const tocId: string = spine.$.toc;
  const { href } = getManifestItemFromId(book, tocId);
  return { href: getManifestItemHrefUrl(book, href as string) };
}
