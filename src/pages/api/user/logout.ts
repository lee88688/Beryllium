import { createSuccessRes } from "y/utils/apiResponse";
import { withSessionRoute } from "y/server/wrap";

export default withSessionRoute(function handler(req, res) {
  req.session.destroy();

  return createSuccessRes(res, null);
});
