export function nonNegativeInteger(value?: number | null) {
  const parsed = Number(value || 0)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0
  }
  return Math.floor(parsed)
}

export function parseTimestampText(value?: string) {
  const raw = value || ''
  const normalized = raw.includes(' ') ? raw.replace(' ', 'T') : raw
  const time = Date.parse(normalized)
  return Number.isFinite(time) ? time : 0
}

export function latestTimestampText(left?: string, right?: string) {
  const leftTime = parseTimestampText(left)
  const rightTime = parseTimestampText(right)
  if (!leftTime) {
    return right
  }
  if (!rightTime) {
    return left
  }
  return rightTime > leftTime ? right : left
}
