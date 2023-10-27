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

function getContentObject(content: string) {
  if (!content) return {} as any;
  return JSON.parse(content);
}

function getContentMetadata(contentObject: any) {
  const { package: p } = contentObject ?? ({} as any);
  if (!p) return {};
  return p.metadata[0];
}

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
              return getContentObject(data.content);
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
              return getContentMetadata(data.contentObject);
            },
          },
        },
      },
    });

// type Client = typeof prisma;

// if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

type Book = Prisma.Book & { contentObject: any; contentMetadata: any };

function getManifestItemFromId(book: Book, id?: string): Record<string, string> | undefined {
  if (!id) return;

  const { contentObject: { package: p } = {} } = book;
  if (!p) return;
  const manifest = p.manifest[0];
  const items: any[] = manifest.item || [];
  const item = items.find(({ $ }) => $.id === id);
  return item ? item.$ : undefined;
}

function getManifestItemHrefUrl(book: Book, href: string) {
  if (!book.contentPath) return "";
  const dir = path.dirname(book.contentPath);
  // fixme: asar-async has a bug when path is windows like, eg: OEBPS\toc.ncx
  // original code use `path-webpack` package
  // return path.join(dir, href);
  return `${dir}/${href}`
}

function getMetaFromName(book: Book, name: string): string | undefined {
  const metadata = book.contentMetadata;
  const meta: any[] = metadata.meta || [];
  const res = meta.find(({ $: { name: mName } }) => mName === name);
  if (!res) return;
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

export function fillInBaseInfo(book: Omit<Prisma.Book, 'id'>) {
  if (!book.content) {
    return;
  }

  const contentObject = getContentObject(book.content)
  const contentMetadata = getContentMetadata(contentObject)
  const resultBook = new Proxy(book, {
    get(target, prop, receiver) {
      if (prop === 'contentObject') return contentObject
      else if (prop === 'contentMetadata') return contentMetadata

      return Reflect.get(target, prop, receiver)
    }
  }) as Book

  book.title = getMetadataFromKey(resultBook, "title");
  book.description = getMetadataFromKey(resultBook, "description");
  book.author = getMetadataFromKey(resultBook, "creator");

  const coverId = getMetaFromName(resultBook, "cover");
  const coverItem = getManifestItemFromId(resultBook, coverId);
  if (!coverItem) {
    book.cover = ''
    return;
  }
  book.cover = getManifestItemHrefUrl(resultBook, coverItem.href);
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
