export function normalizeProductKey(value?: string | null) {
  return String(value || '').trim().toUpperCase()
}

export function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0)
}

export function hasCjkText(value?: string) {
  return /[\u3400-\u9fff]/.test(String(value || ''))
}
