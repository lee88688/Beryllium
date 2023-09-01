import { post } from "y/utils/request";
import { withIronSessionApiRoute } from 'iron-session/next'
import { prisma } from "y/server/db";
import { createFailRes, createSuccessRes } from "y/utils/apiResponse";
import { ironOptions } from "y/config";

interface LoginParam {
  email: string;
  password: string;
}

// password should encrypt
export default withIronSessionApiRoute(async function handler(req, res) {
  const data = req.body as LoginParam
  const user = await prisma.user.findFirst({
    where: { email: data.email, password: data.password },
    select: {
      id: true
    }
  })

  if (!user) {
    return createFailRes(res, 'email or password may not be correct')
  }

  req.session.user = user
  await req.session.save()
  
  return createSuccessRes(res, null)
}, ironOptions)

export function apiLogin(form: LoginParam) {
  return post('/api/user/login', form)
}