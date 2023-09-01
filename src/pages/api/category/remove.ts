import type {NextApiHandler} from 'next'
import { prisma } from 'y/server/db'
import { createSuccessRes } from 'y/utils/apiResponse';
import { post } from 'y/utils/request';

interface RemoveCategoryParam {
  id: number
}

const handler: NextApiHandler = async (req, res) => {
  const data = req.body as RemoveCategoryParam
  await prisma.category.delete({ where: { id: data.id }})
  return createSuccessRes(res, null)
}

export default handler

export function apiRemoveCategory(data: RemoveCategoryParam) {
  return post('/api/category/remove', data)
}