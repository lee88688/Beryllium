import type {NextApiHandler} from 'next'
import { prisma } from 'y/server/db'
import { createSuccessRes } from 'y/utils/apiResponse';
import { post } from 'y/utils/request';

const handler: NextApiHandler = async (req, res) => {
  const data = req.body as number[]
  await prisma.categoryBook.deleteMany({ where: { id: { in: data }}})

  return createSuccessRes(res, null)
}

export default handler

export function apiRemoveBooksFromCategory(ids: number[]) {
  return post('/api/category/removeBooks', ids)
}