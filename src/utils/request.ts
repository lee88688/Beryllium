export type ApiResponseData<T> = {
  data: T
  isSuccess: boolean
}

// TODO: when isSuccess is false throw error

export function get<T>(url: string) {
  return fetch(url).then(res => res.json() as Promise<ApiResponseData<T>>)
}

export function post<T>(url: string, body?: unknown) {
  if (body instanceof FormData) {
    return fetch(url, {
      method: 'POST',
      body
    }).then(res => res.json() as Promise<ApiResponseData<T>>)
  }

  return fetch(url, {
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body)
  }).then(res => res.json() as Promise<ApiResponseData<T>>)
}