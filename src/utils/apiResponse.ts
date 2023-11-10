import type { NextApiResponse } from "next";

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
