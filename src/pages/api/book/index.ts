
import type { NextApiHandler } from "next";
import { withSessionRoute } from "y/config";
import { prisma } from "y/server/db";
import { createSuccessRes } from "y/utils/apiResponse";

const handler: NextApiHandler = async (req, res) => {
    const { user } = req.session
    const { category } = req.query;
    const books = await prisma.book.findMany({
      where: {
        user: {
          id: user.id
        },
        categoryBook: {
          some: {
            categoryId: Number.parseInt(category as string)
          }
        }
      }
    })
    createSuccessRes(res, books)
}

export default withSessionRoute(handler)