import type { NextApiHandler, PageConfig } from "next";
import { withSessionRoute } from "y/config";
import { createSuccessRes } from "y/utils/apiResponse";
import formidable from "formidable";
import { saveEpubFile } from "y/server/service/file";
import { Readable } from 'stream'

export const config: PageConfig = {
  api: {
    bodyParser: false
  }
}

const handler: NextApiHandler = async (req, res) => {
  const userId = req.session.user.id

  const form = formidable({});
  form.onPart = (part) => {
    if (part.originalFilename) {
      const readable = new Readable()
      saveEpubFile(userId, readable).catch(e => {
        console.error(e)
      })
      part.on('data', (chunk: Buffer) => {
        readable.emit('data', chunk)
      })
      part.on('end', () => readable.emit('end'))
    }
  };

  await form.parse(req)

  createSuccessRes(res, null)
};

export default withSessionRoute(handler);