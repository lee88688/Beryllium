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
