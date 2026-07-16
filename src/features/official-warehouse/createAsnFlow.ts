export type CandidateSearch = {
  keyword?: string
  partnerSkus?: string[]
}

export function parseCandidateSearch(rawValue: string): CandidateSearch {
  const raw = rawValue.trim()
  if (!raw) return {}
  const tokens = raw
    .split(/[\n\r,，]+/)
    .map((value) => value.trim())
    .filter(Boolean)
  const normalized = Array.from(new Set(tokens.map((value) => value.toUpperCase())))
  const isBatchPskuSearch = /[\n\r,，]/.test(raw)
  return isBatchPskuSearch ? { partnerSkus: normalized } : { keyword: raw }
}
