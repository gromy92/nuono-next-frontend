export function formatChartNumber(value: number | undefined) {
  return Number(value || 0).toLocaleString()
}

export function formatChartNullableNumber(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? value.toLocaleString() : '-'
}

export function formatChartPrice(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value)
    ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '-'
}
