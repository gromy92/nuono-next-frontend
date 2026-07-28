import type { CompetitorWatchProduct } from './types'

export function normalizeProductKeywordNorm(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError'
}

export function mergeProductTitleFields(
  existing: CompetitorWatchProduct,
  incoming: CompetitorWatchProduct
) {
  return {
    ...existing,
    ...incoming,
    title: incoming.title || existing.title,
    titleCn: incoming.titleCn || existing.titleCn
  }
}

export function productTitleLines(product: CompetitorWatchProduct) {
  const englishTitle = product.title?.trim() || ''
  const chineseTitle = product.titleCn?.trim() || ''
  const primary = chineseTitle || englishTitle || '未命名商品'
  const secondary =
    englishTitle && normalizeSearchText(englishTitle) !== normalizeSearchText(primary)
      ? englishTitle
      : ''
  return {
    primary,
    secondary,
    alt: chineseTitle || englishTitle || '商品图片'
  }
}

export function productListIdentityCodes(product: CompetitorWatchProduct) {
  const psku = product.partnerSku || ''
  return [
    { value: psku || '-', copyText: psku || undefined },
    ...(product.selfNoonProductCode
      ? [
          {
            value: product.selfNoonProductCode,
            copyText: product.selfNoonProductCode
          }
        ]
      : [])
  ]
}

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase()
}
