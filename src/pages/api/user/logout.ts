import { createSuccessRes } from "y/utils/apiResponse";
import { withSessionRoute } from "y/config";

export default withSessionRoute(function handler(req, res) {
  req.session.destroy();

  return createSuccessRes(res, null);
});
