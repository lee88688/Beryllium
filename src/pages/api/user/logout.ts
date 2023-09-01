import { post } from "y/utils/request";

export default function handler() {}

export function apiLogout() {
  return post('/api/user/logout')
}