"use client";

import { type UnwrapPromise } from "@prisma/client/runtime/library";
import { enqueueSnackbar } from "notistack";

export type ApiResponseData<T> = {
  data: T;
  isSuccess: boolean;
  message?: string;
};

export function get<T>(url: string, query?: Record<string, unknown>) {
  const searchParams = new URLSearchParams(query as Record<string, string>);
  const search = searchParams.size ? `?${searchParams.toString()}` : "";
  return fetch(`${url}${search}`).then(async (res) => {
    const json = await (res.json() as Promise<ApiResponseData<T>>);
    if (!json.isSuccess && json.message) {
      enqueueSnackbar(json.message, { variant: "error" });
      throw new Error(json.message);
    }
    return json;
  });
}

export function post<T>(url: string, body?: unknown) {
  let promise: Promise<ApiResponseData<T>>;
  if (body instanceof FormData) {
    promise = fetch(url, {
      method: "POST",
      body,
    }).then((res) => res.json() as Promise<ApiResponseData<T>>);
  } else {
    promise = fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }).then((res) => res.json() as Promise<ApiResponseData<T>>);
  }

  return promise.then((res) => {
    if (!res.isSuccess && res.message) {
      enqueueSnackbar(res.message, { variant: "error" });
      throw new Error(res.message);
    }
    return res;
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function requestAction<Action extends (...args: any[]) => any>(
  action: Action,
) {
  return async (
    ...args: Parameters<Action>
  ): Promise<UnwrapPromise<ReturnType<Action>>> => {
    let res;
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      res = await action(...args);
      const { isSuccess, message } = res as ApiResponseData<unknown>;
      if (!isSuccess && message) {
        enqueueSnackbar(message, { variant: "error" });
      }
    } catch (e) {
      throw e;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return res;
  };
}
