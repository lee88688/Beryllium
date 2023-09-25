export function get<T>(url: string) {
  return fetch(url).then(res => res.json() as T)
}

export function post<T, B>(url: string, body?: B) {
  if (body instanceof FormData) {
    return fetch(url, {
      method: 'POST',
      body
    }).then(res => res.json() as T)
  }

  return fetch(url, {
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body)
  }).then(res => res.json() as T)
}