import { post, get } from "y/utils/request";

export function uploadBook(file: File) {
  const form = new FormData();
  form.append("file", file);
  return post("/api/book/create", form);
}

export function getFileUrl(fileName: string, path: string) {
  return `/api/book/file/${fileName}/${path}`;
}
