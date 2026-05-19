export async function readApiErrorMessage(response: Response, fallback?: string) {
  let message = fallback || `后端返回 ${response.status}`;
  try {
    const text = (await response.text()).trim();
    if (!text) {
      return message;
    }
    try {
      const payload = JSON.parse(text) as { message?: string; error?: string };
      return payload.message || payload.error || text;
    } catch {
      return text;
    }
  } catch {
    return message;
  }
}

export async function parseApiResponse<T>(response: Response, fallback?: string): Promise<T> {
  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, fallback));
  }
  return (await response.json()) as T;
}

export function normalizeError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function firstFormValidationMessage(error: unknown) {
  if (!error || typeof error !== 'object' || !('errorFields' in error)) {
    return undefined;
  }
  const errorFields = (error as { errorFields?: Array<{ errors?: string[] }> }).errorFields;
  return errorFields?.flatMap((field) => field.errors ?? []).find(Boolean) || '请检查表单必填项。';
}
