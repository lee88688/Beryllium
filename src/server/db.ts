/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import * as path from 'path'
import { PrismaClient } from "@prisma/client";
import { env } from "y/env.mjs";

// const globalForPrisma = globalThis as unknown as {
//   prisma: PrismaClient | undefined;
// };

export const prisma =
  // globalForPrisma.prisma ??
  new PrismaClient({
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  }).$extends({
    result: {
      book: {
        contentObject: {
          needs: { content: true },
          compute(data) {
            return JSON.parse(data.content)
          },
        }
      }
    }
  }).$extends({
    result: {
      book: {
        contentMetadata: {
          needs: { contentObject: true },
          compute(data) {
            const { package: p } = data.contentObject ?? {} as any;
            if (!p) return {};
            return p.metadata[0];
          },
        },
        getManifestItemFromId: {
          needs: { contentObject: true },
          compute(data) {
            return function (id: string) {
              const { contentObject: { package: p } = {} } = data;
              if (!p) return {};
              const manifest = p.manifest[0];
              const items: any[] = manifest.item || [];
              const item = items.find(({ $ }) => $.id === id);
              return item ? item.$ : null;
            }
          },
        },
        getManifestItemHrefUrl: {
          needs: { contentPath: true },
          compute(data) {
            return function (href: string) {
              if (!data.contentPath) return;
              const dir = path.dirname(data.contentPath);
              return path.join(dir, href);
            }
          },
        }
      }
    }
  }).$extends({
    result: {
      book: {
        getMetaFromName: {
          needs: { contentMetadata: true },
          compute(data) {
            return (name: string) => {
              const metadata = data.contentMetadata;
              const meta: any[] = metadata.meta || [];
              const res = meta.find(({ $: { name: mName } }) => mName === name);
              if (!res) return null;
              return res.$.content;
            }
          }
        },
        getMetadataFromKey: {
          needs: { contentMetadata: true },
          compute(data) {
            return function (key: string) {
              if (!key) {
                console.warn('model Book method(getMetadataFromKey) get empty key.');
                return;
              }
              const metadata = data.contentMetadata;
              const internalKey = `dc:${key}`;
              const value: any[] = metadata[internalKey] || metadata[key] || [];
              /**
               * if xml item does not contain attributes(<tag>xxx</tag>), array item is just a string,
               * in contrast, array item is an object like ({ _: 'xxx', $: {} })
               */
              return value.length ? value.map(item => (item._ ? item._ : item)).join(',') : '';
            }
          },
        },
        getTocPath: {
          needs: { getManifestItemFromId: true, getManifestItemHrefUrl: true, contentObject: true },
          compute(data) {
            return function () {
              // todo: support epub3 toc
              const { contentObject: { package: p } } = data;
              const spine = p.spine[0];
              const tocId = spine.$.toc;
              const { href } = data.getManifestItemFromId(tocId);
              return { href: data.getManifestItemHrefUrl(href) };
            }
          },
        }
      }
    }
  })

// if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
