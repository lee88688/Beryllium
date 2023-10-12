import { type AddBooksToCategoryParams } from "./api/category/addBooks";

import { post, get } from "y/utils/request";
import { type CreateCategoryParam } from "./api/category/create";
import { type RemoveCategoryParam } from "./api/category/remove";
import { type LoginParam } from "./api/user/login";
import { type DeleteBookParam } from "./api/book/destroy";
import { type CreateMarkParams } from "./api/mark/create";
import { type GetMarkQuery } from "./api/mark";
import { type UpdateMarkParams } from "./api/mark/update";

export function apiAddBooksToCategory(data: AddBooksToCategoryParams[]) {
  return post("/api/category/addBooks", data);
}

export function apiCreateCategory(data: CreateCategoryParam) {
  return post("/api/category/create", data);
}

export function apiRemoveCategory(data: RemoveCategoryParam) {
  return post("/api/category/remove", data);
}

export function apiRemoveBooksFromCategory(
  categoryId: number,
  bookIds: number[],
) {
  return post("/api/category/removeBooks", bookIds);
}

export function apiLogin(form: LoginParam) {
  return post("/api/user/login", form);
}

export function apiLogout() {
  return post("/api/user/logout");
}

export function apiDeleteBook(param: DeleteBookParam) {
  return post("/api/book/destroy", param);
}

export function apiGetBookCurrent(id: number | string) {
  return get<string>(`/api/book/${id}`);
}

export function apiUpdateBookCurrent(id: number | string, epubcfi: string) {
  return post(`/api/book/${id}/update`, { current: epubcfi });
}

export function uploadBook(file: File) {
  const form = new FormData();
  form.append("file", file);
  return post("/api/book/create", form);
}

export function getMark(query: GetMarkQuery) {
  return get("/api/mark", query);
}

export function addMark(params: CreateMarkParams) {
  return post<number>("/api/mark/create", params);
}

export function removeMark(id: number) {
  return post("/api/mark/destroy", { id });
}

export function updateMark(params: UpdateMarkParams) {
  return post("/api/mark/udpate", params);
}

export function getFileUrl(fileName: string, path: string) {
  return `/api/book/file/${fileName}/${path}`;
}
