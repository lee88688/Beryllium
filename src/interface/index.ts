import type * as Prisma from '@prisma/client'

export type Book = Prisma.Book & { category: Prisma.Category[] }