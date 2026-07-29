export function splitPipeText(text?: string, fallback: string[] = []) {
  const values = (text || '')
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean)
  return values.length ? values : fallback
}

export function placeholderImage(label: string, tone: string, accent: string) {
  const safeLabel = escapeSvgText(label)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240"><defs><linearGradient id="g" x1="0%" x2="100%" y1="0%" y2="100%"><stop stop-color="${tone}" offset="0%"/><stop stop-color="${accent}" offset="100%"/></linearGradient></defs><rect width="320" height="240" fill="url(#g)" rx="22"/><rect x="24" y="24" width="272" height="192" rx="18" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.3)"/><text x="160" y="126" font-size="18" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif">${safeLabel}</text></svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

export function scorePart(totalScore: number, ratio: number) {
  return Math.max(0, Math.round(totalScore * ratio))
}

export function numberValue(value?: number) {
  return value == null ? 0 : Number(value)
}

export function nonEmpty(value?: string | null) {
  return value && value.trim() ? value.trim() : undefined
}

export function upper(value?: string | null) {
  return value?.trim().toUpperCase()
}

export function extractOfferId(candidateUrl?: string) {
  if (!candidateUrl) return undefined
  const pathMatch = candidateUrl.match(/\/offer\/(\d+)\.html/)
  if (pathMatch) return pathMatch[1]
  return candidateUrl.match(/(?:offerId|offer_id|id)=(\d+)/)?.[1]
}

function escapeSvgText(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
