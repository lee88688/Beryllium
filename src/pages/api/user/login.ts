import { post } from "y/utils/request";

interface LoginDTO {
  email: string;
  password: string;
}

export default async function handler() {}

export function login(form: LoginDTO) {
  return post('/api/user/login', form)
}