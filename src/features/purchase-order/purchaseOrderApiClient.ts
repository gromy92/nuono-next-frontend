import { apiFetch, parseApiResponse, readApiErrorMessage } from '../../shared/api'

export async function getPurchaseOrderJson<TResponse>(url: string, fallback: string) {
  return parseApiResponse<TResponse>(await apiFetch(url), fallback)
}

export async function sendPurchaseOrderJson<TResponse>(
  url: string,
  method: 'POST' | 'PUT' | 'DELETE',
  body: unknown,
  fallback: string
) {
  return parseApiResponse<TResponse>(
    await apiFetch(url, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body)
    }),
    fallback
  )
}

export async function downloadPurchaseOrderFile(url: string, fallback: string, defaultFilename: string) {
  const response = await apiFetch(url)
  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, fallback))
  }
  return {
    blob: await response.blob(),
    filename: readDownloadFilename(response.headers.get('content-disposition')) || defaultFilename
  }
}

export async function uploadPurchaseOrderForm<TResponse>(url: string, formData: FormData, fallback: string) {
  return parseApiResponse<TResponse>(
    await apiFetch(url, {
      method: 'POST',
      body: formData
    }),
    fallback
  )
}

function readDownloadFilename(contentDisposition: string | null) {
  if (!contentDisposition) return undefined

  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition)?.[1]
  if (encoded) {
    try {
      return decodeURIComponent(encoded)
    } catch {
      return encoded
    }
  }
  return /filename="?([^";]+)"?/i.exec(contentDisposition)?.[1]
}
