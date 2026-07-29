import type {
  PurchaseOrderItem,
  PurchaseOrderStatus
} from '../types'

export function buildItemTitlePair(item: PurchaseOrderItem) {
  const candidates = [
    item.sourceTitleCn,
    item.productTitle,
    item.sourceTitle,
    item.sourcingSpec,
    item.sourcingSize,
    item.sourcingColor
  ]
  const chineseTitle = firstMatchingText(candidates, containsCjk)
    || firstMatchingText([item.sourcingSpec, item.sourcingSize, item.sourcingColor], Boolean)
    || item.partnerSku
  const englishTitle = firstMatchingText([item.sourceTitle, item.productTitle, item.sourceTitleCn], looksMostlyEnglish)
    || firstMatchingText([item.sourceTitle, item.productTitle, item.sourceTitleCn], Boolean)
    || item.partnerSku
  const displayChineseTitle = stripLeadingPsku(chineseTitle, item.partnerSku) || item.partnerSku
  const displayEnglishTitle = stripLeadingPsku(englishTitle, item.partnerSku)
  return {
    cn: displayChineseTitle,
    en: displayEnglishTitle === displayChineseTitle ? '' : displayEnglishTitle
  }
}

export function stripLeadingPsku(value: string, psku?: string) {
  const normalized = value.trim()
  const normalizedPsku = psku?.trim()
  if (!normalizedPsku) {
    return normalized
  }
  const pattern = new RegExp(`^${escapeRegExp(normalizedPsku)}(?:$|[\\s:_-]+)`, 'i')
  return normalized.replace(pattern, '').trim()
}

export function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function sameDisplayText(left?: string, right?: string) {
  return (left || '').trim().toUpperCase() === (right || '').trim().toUpperCase()
}

export function firstMatchingText(values: Array<string | undefined>, predicate: (value: string) => boolean) {
  for (const value of values) {
    const normalized = value?.trim()
    if (normalized && predicate(normalized)) {
      return normalized
    }
  }
  return ''
}

export function containsCjk(value: string) {
  return /[\u3400-\u9fff]/.test(value)
}

export function looksMostlyEnglish(value: string) {
  return /[A-Za-z]/.test(value) && !containsCjk(value)
}

export function deriveStatus(items: PurchaseOrderItem[]): PurchaseOrderStatus {
  if (!items.length) {
    return 'draft'
  }
  if (items.some((item) => item.collectionStatus === 'failed')) {
    return 'exception'
  }
  if (items.some((item) => item.collectionStatus === 'collecting')) {
    return 'collecting'
  }
  const completed = items.filter((item) => item.collectionStatus === 'succeeded' || item.collectionStatus === 'reused')
  if (completed.length === items.length) {
    return 'done'
  }
  if (completed.length) {
    return 'partial_done'
  }
  return 'pending_collection'
}
