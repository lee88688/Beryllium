import { post } from "y/utils/request";

interface LoginDTO {
  email: string;
  password: string;
}

export default async function handler() {}

export function apiLogin(form: LoginDTO) {
  return post('/api/user/login', form)
}