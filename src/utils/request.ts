export type ApiResponseData<T> = {
  data: T;
  isSuccess: boolean;
};

// TODO: when isSuccess is false throw error

export function get<T>(url: string, query?: Record<string, unknown>) {
  const searchParams = new URLSearchParams(query as Record<string, string>);
  const search = searchParams.size ? `?${searchParams.toString()}` : "";
  return fetch(`${url}${search}`).then(
    (res) => res.json() as Promise<ApiResponseData<T>>,
  );
}

export function post<T>(url: string, body?: unknown) {
  if (body instanceof FormData) {
    return fetch(url, {
      method: "POST",
      body,
    }).then((res) => res.json() as Promise<ApiResponseData<T>>);
  }

  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  }).then((res) => res.json() as Promise<ApiResponseData<T>>);
}
