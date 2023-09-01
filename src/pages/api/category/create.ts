import type {NextApiHandler} from 'next'
import { prisma } from 'y/server/db'
import { createSuccessRes } from 'y/utils/apiResponse';
import { post } from 'y/utils/request';

interface CreateCategoryParam {
  name: string;
  userId: number;
}

const handler: NextApiHandler = async (req, res) => {
  const data = req.body as CreateCategoryParam
  await prisma.category.create({ data: { name: data.name, userId: data.userId }})
  return createSuccessRes(res, null)
}

export default handler

export function apiCreateCategory(data: CreateCategoryParam) {
  return post('/api/category/create', data)
}