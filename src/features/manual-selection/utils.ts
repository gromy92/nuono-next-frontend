import dayjs from 'dayjs'
import type { ProductSelectionSourceCollection } from '../source-collection/types'

const CURRENCY_CODE_PATTERN = '(AED|SAR|USD|EGP|CNY|RMB|EUR|GBP|KWD|QAR|BHD|OMR)'
const KNOWN_CURRENCY_PATTERN = new RegExp(`\\b${CURRENCY_CODE_PATTERN}\\b|${CURRENCY_CODE_PATTERN}\\s*\\d|[$€£¥]|د\\.إ|ر\\.س`, 'i')
const CURRENCY_WITH_AMOUNT_PATTERN = new RegExp(`\\b${CURRENCY_CODE_PATTERN}\\s*(?=\\d)`, 'gi')

export function normalizeManualSelectionCurrencySpacing(value: string) {
  return value.replace(CURRENCY_WITH_AMOUNT_PATTERN, (_, currency: string) => `${currency.toUpperCase()} `)
}

export function normalizeManualSelectionKeyword(value?: string) {
  return (value || '').trim().toLowerCase()
}

export function inferManualSelectionPlatform(url?: string) {
  const normalized = normalizeManualSelectionKeyword(url)
  if (normalized.includes('noon.')) {
    return 'Noon'
  }
  if (normalized.includes('amazon.')) {
    return 'Amazon'
  }
  if (normalized.includes('shein.')) {
    return 'SHEIN'
  }
  if (normalized.includes('1688.')) {
    return '1688'
  }
  return '其他'
}

export function supportedManualSelectionPlatform(platform: string) {
  return ['Noon', 'Amazon', 'SHEIN'].includes(platform)
}

export function manualSelectionStatusText(status: string) {
  if (status === 'running') {
    return '采集中'
  }
  if (status === 'failed') {
    return '采集失败'
  }
  return '采集成功'
}

export function manualSelectionCollectionUrl(record: ProductSelectionSourceCollection) {
  return record.pageUrl || record.sourceUrl || ''
}

export function manualSelectionCollectionSourceLabel(record: ProductSelectionSourceCollection) {
  const source = [
    record.collectionSource,
    record.sourceType,
    record.notes
  ].filter(Boolean).join(' ').toLowerCase()
  if (source.includes('plugin')
    || source.includes('extension')
    || source.includes('browser-extension')
    || source.includes('插件')) {
    return '插件'
  }
  return '浏览器'
}

export function manualSelectionArabicText(record: ProductSelectionSourceCollection) {
  const candidates = [
    record.sourceTitleAr,
    record.sourceDescriptionAr,
    record.selectedTextAr,
    ...(record.sourceSellingPointsAr || [])
  ].map((item) => (item || '').trim())
  return candidates.find(containsArabicText) || ''
}

export function formatManualSelectionPriceSummary(record: ProductSelectionSourceCollection) {
  const price = record.priceSummary?.trim()
  if (!price) {
    return ''
  }
  const normalizedPrice = normalizeManualSelectionCurrencySpacing(price)
  if (KNOWN_CURRENCY_PATTERN.test(normalizedPrice)) {
    return normalizedPrice
  }
  const currency = inferManualSelectionPriceCurrency(record)
  return currency ? `${currency} ${normalizedPrice}` : normalizedPrice
}

function inferManualSelectionPriceCurrency(record: ProductSelectionSourceCollection) {
  const sourceUrl = `${record.pageUrl || ''} ${record.sourceUrl || ''}`.toLowerCase()
  if (sourceUrl.includes('amazon.ae') || sourceUrl.includes('/uae-')) {
    return 'AED'
  }
  if (sourceUrl.includes('amazon.sa') || sourceUrl.includes('/saudi-')) {
    return 'SAR'
  }
  if (sourceUrl.includes('amazon.eg') || sourceUrl.includes('/egypt-')) {
    return 'EGP'
  }
  if (sourceUrl.includes('amazon.com')) {
    return 'USD'
  }
  const storeCode = (record.storeCode || '').toLowerCase()
  if (storeCode.includes('-nae') || storeCode.endsWith('-ae')) {
    return 'AED'
  }
  if (storeCode.includes('-ksa') || storeCode.endsWith('-sa')) {
    return 'SAR'
  }
  if (storeCode.endsWith('-eg')) {
    return 'EGP'
  }
  if (record.sourcePlatform === 'Noon') {
    return 'AED'
  }
  return ''
}

export function containsArabicText(value?: string) {
  return /[\u0600-\u06FF]/.test(value || '')
}

export function manualSelectionSkuCount(_record: ProductSelectionSourceCollection) {
  return 1
}

export function isLikelyManualSelectionImageUrl(value?: string) {
  const normalized = (value || '').trim()
  if (!normalized) {
    return false
  }
  if (/^data:image\//i.test(normalized) || /^blob:/i.test(normalized)) {
    return true
  }
  try {
    const url = new URL(normalized)
    return /\.(?:avif|bmp|gif|jpe?g|png|svg|webp)$/i.test(url.pathname)
  } catch {
    return /\.(?:avif|bmp|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i.test(normalized)
  }
}

export function manualSelectionImageCandidates(record: ProductSelectionSourceCollection, preferredUrl?: string) {
  return [preferredUrl, record.sourceImageUrl, ...(record.imageUrls || [])]
    .map((item) => (item || '').trim())
    .filter((item, index, list) => item && list.indexOf(item) === index)
    .filter(isLikelyManualSelectionImageUrl)
    .map((url, index) => ({ url, index, score: manualSelectionImageCandidateScore(url) }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map((item) => item.url)
}

function manualSelectionImageCandidateScore(value: string) {
  const normalized = value.toLowerCase()
  let score = 0
  if (/^data:image\//i.test(value) || /^blob:/i.test(value)) {
    score += 200
  }
  if (normalized.includes('m.media-amazon.com/images/i/')
    || normalized.includes('images-na.ssl-images-amazon.com/images/i/')
    || normalized.includes('images-eu.ssl-images-amazon.com/images/i/')) {
    score += 120
  }
  if (normalized.includes('f.nooncdn.com/p/')
    || normalized.includes('img.ltwebstatic.com/images')
    || normalized.includes('img.kwcdn.com/product/')) {
    score += 120
  }
  if (/[_./-](?:sx|sy|sl|ul)\d{3,}/i.test(value)) {
    score += 20
  }
  if (/_ac_us40_/i.test(value)) {
    score -= 30
  }
  if (/(?:sprite|logo|icon|badge|banner|header|flyout|prime|widget|sash|mpcms|nav-|privacy)/i.test(value)) {
    score -= 120
  }
  return score
}

export function formatManualSelectionCollectedAt(value?: string) {
  if (!value) {
    return '-'
  }
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm:ss') : value
}

export function formatManualSelectionCompleteness(record: ProductSelectionSourceCollection) {
  const total = record.collectedFieldTotal || (['Amazon', 'Noon', 'SHEIN'].includes(record.sourcePlatform) ? 15 : 8)
  const specAttributeCount = record.specAttributeCount ?? countStructuredSpecHints(record.specHints)
  return {
    basics: `基础信息：${record.collectedFieldCount || 0}/${total}`,
    other: `其他 ${specAttributeCount}条`,
    full: `基础信息：${record.collectedFieldCount || 0}/${total}　其他 ${specAttributeCount}条`
  }
}

function countStructuredSpecHints(specHints?: string[]) {
  return (specHints || []).filter((item) => item.search(/[:：]/) > 0).length
}
