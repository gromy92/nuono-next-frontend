import { apiFetch, parseApiResponse, readApiErrorMessage } from '../../shared/api'

export async function getJson<TResponse>(url: string, fallback: string) {
  return parseApiResponse<TResponse>(await apiFetch(url), fallback)
}

export async function sendJson<TResponse>(
  url: string,
  method: 'POST' | 'PUT' | 'DELETE',
  body: unknown,
  fallback: string
) {
  return parseApiResponse<TResponse>(await apiFetch(url, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  }), fallback)
}

export async function getFile(url: string, fallback: string, fallbackFilename: string) {
  const response = await apiFetch(url)
  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, fallback))
  }
  const disposition = response.headers.get('Content-Disposition') || ''
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i)
  const plainMatch = disposition.match(/filename="?([^";]+)"?/i)
  const encodedName = utf8Match?.[1]
  return {
    blob: await response.blob(),
    filename: encodedName ? decodeURIComponent(encodedName) : plainMatch?.[1] || fallbackFilename
  }
}
