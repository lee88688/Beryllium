import { createSuccessRes } from "y/utils/apiResponse";
import { withSessionRoute } from "y/server/wrap";

export default withSessionRoute(function handler(req, res, session) {
  session.destroy();

  return createSuccessRes(res, null);
});
