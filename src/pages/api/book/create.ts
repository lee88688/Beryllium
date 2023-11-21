import type { NextApiHandler, PageConfig } from "next";
import { withSessionRoute } from "y/server/wrap";
import { createSuccessRes } from "y/utils/apiResponse";
import formidable from "formidable";
import { saveEpubFile } from "y/server/service/file";
import { Readable } from "stream";

export const config: PageConfig = {
  api: {
    bodyParser: false,
  },
};

const handler: NextApiHandler = async (req, res) => {
  const userId = req.session.user.id;

  const form = formidable({});
  let cacheData = Buffer.alloc(0);
  form.onPart = (part) => {
    if (part.originalFilename) {
      console.log("form file", part.originalFilename);
      part.on("data", (chunk: Buffer) => {
        cacheData = Buffer.concat([cacheData, chunk]);
      });
    }
  };

  await form.parse(req);

  // create readable from part data
  const readable = Readable.from(cacheData);
  await saveEpubFile(userId, readable).catch((e) => {
    console.error(e);
  });

  createSuccessRes(res, null);
};

export default withSessionRoute(handler);
