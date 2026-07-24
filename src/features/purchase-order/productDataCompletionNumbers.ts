export function normalizeProductDataNumber(value: unknown) {
  if (value === null || value === undefined) {
    return undefined
  }
  if (typeof value === 'string' && value.trim() === '') {
    return undefined
  }
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : undefined
}
