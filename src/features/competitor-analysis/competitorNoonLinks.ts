export function buildNoonSearchUrl(
  keyword: string,
  siteCode: string,
  watchProductId?: string,
  keywordId?: string
) {
  const searchUrl = `https://www.noon.com/${noonMarketPath(siteCode)}/search/?q=${encodeURIComponent(keyword)}`
  const fragment = new URLSearchParams()
  if (watchProductId) {
    fragment.set('nuonoWatchProductId', watchProductId)
  }
  if (keywordId && /^\d+$/.test(keywordId)) {
    fragment.set('nuonoKeywordId', keywordId)
  }
  fragment.set('nuonoKeyword', keyword)
  const fragmentText = fragment.toString()
  return fragmentText ? `${searchUrl}#${fragmentText}` : searchUrl
}

export function noonMarketPath(siteCode: string) {
  const normalized = siteCode.trim().toUpperCase()
  if (normalized === 'SA') return 'saudi-en'
  if (normalized === 'EG') return 'egypt-en'
  return 'uae-en'
}
