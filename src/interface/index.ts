import type * as Prisma from "@prisma/client";

export type Book = Prisma.Book & { category: Prisma.Category[] };

export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

// this error is used for transferring error from server to client
export class RequestError extends Error {
  constructor(
    message: string,
    public error?: unknown,
  ) {
    super(message);
  }
}
