import * as path from "path";
import * as fs from "fs";
import unzipper from "unzipper";
import { mkdirp } from "mkdirp";
import { asarDir, tempDir } from "y/config";
import { type Readable } from "stream";
import asar from "asar";
import { v1 as uuidv1 } from "uuid";
import { rimraf } from "rimraf";
import { EasyAsar, fsGetter } from "asar-async";
import { index as asarIndexSymbol } from 'asar-async/dist/base'
import xml2js from 'xml2js'
import { fillInBaseInfo, prisma } from "../db";
import type * as Prisma from "@prisma/client";

export function asarFileDir(name: string) {
  return path.join(asarDir, `${name}.asar`)
}

export async function convertEpubToAsar(
  fileStream: Readable,
  destFileName: string,
) {
  const outputDir = path.join(tempDir, uuidv1());
  if (!fs.existsSync(outputDir)) {
    await mkdirp(outputDir);
  }

  const writeProcess: Promise<unknown>[] = [];
  await fileStream
    .pipe(unzipper.Parse({ verbose: false }))
    .on("entry", (entry: unzipper.Entry) => {
      const { type, path: fileName } = entry;
      if (type === "Directory") {
        writeProcess.push(mkdirp(path.join(outputDir, fileName)));
      } else {
        writeProcess.push(
          new Promise(async (resolve, reject) => {
            const fileNameDir = path.join(outputDir, fileName);
            const parentDir = path.dirname(fileNameDir);
            // make sure the parent dir exists
            if (!fs.existsSync(parentDir)) {
              await mkdirp(parentDir);
            }
            entry
              .pipe(fs.createWriteStream(fileNameDir))
              .on("close", resolve)
              .on("error", reject);
          }),
        );
      }
    })
    .promise();
  await Promise.all(writeProcess);

  const asarDest = path.join(asarDir, `${destFileName}.asar`);
  if (!fs.existsSync(asarDir)) {
    await mkdirp(asarDir);
  }
  await asar.createPackage(outputDir, asarDest);
  await rimraf(outputDir);
}

export async function readAsarFile(asarFile: string, filePath: string) {
  const ar = new EasyAsar(fsGetter(asarFile));
  await ar.fetchIndex();
  const buffer = await ar.readFile(filePath);
  return buffer;
}

export async function readAsarIndex(asarFile: string) {
  const ar = new EasyAsar(fsGetter(asarFile));
  await ar.fetchIndex();
  return ar[asarIndexSymbol];
}

export async function saveEpubFile(userId: number, fileStream: Readable) {
  const bookFileName = uuidv1();
  await convertEpubToAsar(fileStream, bookFileName);
  const container = await readAsarFile(
    asarFileDir(bookFileName),
    "META-INF/container.xml",
  );
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const xmlObj = await xml2js.parseStringPromise(container.toString("utf8"));
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const contentPath  = xmlObj.container.rootfiles[0].rootfile[0].$["full-path"] as string;
  const contentBuffer = await readAsarFile(
    asarFileDir(bookFileName),
    contentPath,
  );
  const content = await xml2js.parseStringPromise(
    contentBuffer.toString("utf8"),
  ) as Record<string, string>;

  const book = {
    fileName: bookFileName,
    userId,
    contentPath,
    content: JSON.stringify(content),
  } as Omit<Prisma.Book, 'id'>;

  fillInBaseInfo(book);

  await prisma.book.create({
    data: book
  })

  return book;
}
