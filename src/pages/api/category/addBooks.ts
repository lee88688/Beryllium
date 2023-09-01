import type {NextApiHandler} from 'next'
import { prisma } from 'y/server/db'
import { createSuccessRes } from 'y/utils/apiResponse';
import { post } from 'y/utils/request';

interface AddBooksToCategoryDTO {
  bookId: number
  categoryId: number
}

const handler: NextApiHandler = async (req, res) => {
  const data = req.body as AddBooksToCategoryDTO[]
  for (const item of data) {
    await prisma.categoryBook.create({ data: item })
  }
  return createSuccessRes(res, null)
}

export default handler

export function apiAddBooksToCategory(data: AddBooksToCategoryDTO[]) {
  return post('/api/category/addBooks', data)
}