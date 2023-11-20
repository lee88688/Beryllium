import { createHash } from 'node:crypto'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findFirst({ where: { isAdmin: true }})
  if (user) return
  const hash = createHash('sha256')
  await prisma.user.create({
    data: {
      username: 'admin',
      password: hash.update('admin').digest('hex'),
      isAdmin: true,
    }
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })