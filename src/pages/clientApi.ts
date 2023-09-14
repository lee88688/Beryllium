import { type AddBooksToCategoryDTO } from "./api/category/addBooks";

import {post} from "y/utils/request";
import { type CreateCategoryParam } from "./api/category/create";
import { type RemoveCategoryParam } from "./api/category/remove";
import { type LoginParam } from "./api/user/login";

export function apiAddBooksToCategory(data: AddBooksToCategoryDTO[]) {
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
