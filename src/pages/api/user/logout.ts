import { post } from "y/utils/request";
import { withIronSessionApiRoute } from 'iron-session/next'
import { createSuccessRes } from "y/utils/apiResponse";
import { ironOptions } from "y/config";

export default withIronSessionApiRoute(function handler(req, res) {
  req.session.destroy()

  return createSuccessRes(res, null)
}, ironOptions)

export function apiLogout() {
  return post('/api/user/logout')
}