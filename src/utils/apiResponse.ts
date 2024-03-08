import type { NextApiResponse } from "next";

export function createSuccessObj<T>(data: T) {
  return { isSuccess: true, data };
}

export function createFailObj(message: string, error?: unknown) {
  return { isSuccess: false, message, error };
}

export function createSuccessRes<T>(res: NextApiResponse, data: T) {
  res.json({ isSuccess: true, data });
}

export function createFailRes(
  res: NextApiResponse,
  message: string,
  error?: unknown,
) {
  res.json({ isSuccess: false, message, error });
}
