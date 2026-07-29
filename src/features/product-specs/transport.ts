import { apiFetch } from '../../shared/api';

async function readProductSpecError(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { error?: string; message?: string };
    return payload.message || payload.error || fallback;
  } catch {
    return fallback;
  }
}

export async function productSpecRequestJson<T>(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  fallbackError: string | ((status: number) => string)
) {
  const response = await apiFetch(input, init);
  if (!response.ok) {
    const fallback =
      typeof fallbackError === 'function' ? fallbackError(response.status) : fallbackError;
    throw new Error(await readProductSpecError(response, fallback));
  }
  return (await response.json()) as T;
}

export function productSpecPostJson<T>(url: string, body: unknown, fallbackError: string) {
  return productSpecRequestJson<T>(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    },
    fallbackError
  );
}
