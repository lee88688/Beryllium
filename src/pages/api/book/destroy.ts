import { prisma } from "y/server/db";
import { createFailRes, createSuccessRes } from "y/utils/apiResponse";
import { withSessionRoute } from "y/config";
import { type NextApiHandler } from "next";

interface DeleteBookParam {
  id: number
}

const handler: NextApiHandler = async (req, res) => {
  const userId = req.session.user.id
  const param = req.body as DeleteBookParam

  const count = await prisma.book.count({
    where: {
      userId,
      id: param.id
    }
  })
  if (!count) {
    createFailRes(res, 'book id is not found!')
    return
  }
  await prisma.mark.deleteMany({
    where: {
      bookId: param.id,
    }
  })
  await prisma.categoryBook.deleteMany({
    where: {
      bookId: param.id
    }
  })

  return createSuccessRes(res, null)
}

export default withSessionRoute(handler)