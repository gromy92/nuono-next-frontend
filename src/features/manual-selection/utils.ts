import dayjs from 'dayjs'
import type { ProductSelectionSourceCollection } from '../source-collection/types'

type BasicFieldDefinition = {
  label: string
  collected: boolean
}

type SpecPair = {
  label: string
  value: string
  text: string
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
  return ['Noon', 'Amazon'].includes(platform)
}

export function manualSelectionPausedPlatformMessage(platform: string) {
  if (platform === 'SHEIN') {
    return 'SHEIN 完整采集暂缓，当前仅验收 Amazon / Noon。'
  }
  return ''
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

export function manualSelectionSkuCount(_record: ProductSelectionSourceCollection) {
  return 1
}

export function formatManualSelectionCollectedAt(value?: string) {
  if (!value) {
    return '-'
  }
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm:ss') : value
}

export function formatManualSelectionCollectionDuration(record: ProductSelectionSourceCollection) {
  const explicitSeconds = record.collectionDurationSeconds
  const derivedSeconds = deriveDurationSeconds(record.collectionStartedAt, record.collectionFinishedAt)
  const seconds = typeof explicitSeconds === 'number' ? explicitSeconds : derivedSeconds
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds < 0) {
    return ''
  }
  const rounded = Math.floor(seconds)
  const hours = Math.floor(rounded / 3600)
  const minutes = Math.floor((rounded % 3600) / 60)
  const remainingSeconds = rounded % 60
  if (hours > 0) {
    return `${hours}小时${minutes}分${remainingSeconds}s`
  }
  if (minutes > 0) {
    return `${minutes}分${remainingSeconds}s`
  }
  return `${remainingSeconds}s`
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

export function getManualSelectionMissingBasicFields(record: ProductSelectionSourceCollection) {
  return manualSelectionBasicFieldDefinitions(record)
    .filter((field) => !field.collected)
    .map((field) => field.label)
}

export function getManualSelectionCollectedSpecHints(record: ProductSelectionSourceCollection) {
  return parseSpecPairs(record.specHints).map((pair) => pair.text)
}

function countStructuredSpecHints(specHints?: string[]) {
  return (specHints || []).filter((item) => item.search(/[:：]/) > 0).length
}

function manualSelectionBasicFieldDefinitions(record: ProductSelectionSourceCollection): BasicFieldDefinition[] {
  const platform = normalizeManualSelectionKeyword(record.sourcePlatform)
  const specPairs = parseSpecPairs(record.specHints)
  if (platform === 'amazon') {
    return [
      { label: 'ASIN', collected: hasAmazonAsin(record, specPairs) },
      { label: '英文标题', collected: hasText(record.sourceTitle) },
      { label: '阿语标题', collected: hasText(record.sourceTitleAr) },
      { label: '价格', collected: hasText(record.priceSummary) },
      { label: '品牌', collected: hasText(record.brandName) || hasSpecValue(specPairs, ['brand', 'brand name']) },
      { label: 'Unit Count', collected: hasText(record.unitCount) || hasSpecValue(specPairs, ['unit count']) },
      { label: 'Color', collected: hasText(record.colorName) || hasSpecValue(specPairs, ['color', 'colour']) },
      { label: 'Rating', collected: hasRating(specPairs) },
      { label: 'Customer Reviews', collected: hasReviewCount(specPairs) },
      { label: '主图', collected: hasText(record.sourceImageUrl) },
      { label: '商品图片', collected: Boolean(record.imageUrls?.length) },
      { label: '英文卖点', collected: Boolean(record.sourceSellingPointsEn?.length) },
      { label: '阿语卖点', collected: Boolean(record.sourceSellingPointsAr?.length) },
      { label: '英文详情摘要', collected: hasEnglishSummary(record.sourceDescriptionEn) },
      { label: '阿语详情摘要', collected: hasText(record.sourceDescriptionAr) }
    ]
  }
  if (platform === 'noon') {
    return [
      { label: 'Noon SKU', collected: hasNoonSku(record, specPairs) },
      { label: '英文标题', collected: hasText(record.sourceTitle) },
      { label: '阿语标题', collected: hasText(record.sourceTitleAr) },
      { label: '价格', collected: hasText(record.priceSummary) },
      { label: '品牌', collected: hasText(record.brandName) || hasSpecValue(specPairs, ['brand', 'brand name']) },
      { label: 'Unit Count', collected: hasText(record.unitCount) || hasSpecValue(specPairs, UNIT_COUNT_SPEC_LABELS) },
      { label: 'Color', collected: hasText(record.colorName) || hasSpecValue(specPairs, ['color', 'colour', 'color name', 'colour name']) },
      { label: 'Rating', collected: hasRating(specPairs) },
      { label: 'Customer Reviews', collected: hasReviewCount(specPairs) },
      { label: '主图', collected: hasText(record.sourceImageUrl) },
      { label: '商品图片', collected: Boolean(record.imageUrls?.length) },
      { label: '英文卖点', collected: Boolean(record.sourceSellingPointsEn?.length) },
      { label: '阿语卖点', collected: Boolean(record.sourceSellingPointsAr?.length) },
      { label: '英文详情摘要', collected: hasText(record.sourceDescriptionEn) },
      { label: '阿语详情摘要', collected: hasText(record.sourceDescriptionAr) }
    ]
  }
  if (platform === 'shein') {
    return [
      { label: 'SHEIN Product ID', collected: hasSheinProductId(record, specPairs) },
      { label: '英文标题', collected: hasText(record.sourceTitle) },
      { label: '阿语标题', collected: hasText(record.sourceTitleAr) },
      { label: '价格', collected: hasText(record.priceSummary) },
      { label: '主图', collected: hasText(record.sourceImageUrl) },
      { label: '商品图片', collected: Boolean(record.imageUrls?.length) },
      { label: '英文卖点', collected: Boolean(record.sourceSellingPointsEn?.length) },
      { label: '阿语卖点', collected: Boolean(record.sourceSellingPointsAr?.length) },
      { label: '英文详情摘要', collected: hasText(record.sourceDescriptionEn) },
      { label: '阿语详情摘要', collected: hasText(record.sourceDescriptionAr) },
      { label: '品牌', collected: hasText(record.brandName) || hasSpecValue(specPairs, ['brand', 'brand name']) },
      { label: 'Color', collected: hasText(record.colorName) || hasSpecValue(specPairs, ['color', 'colour', 'color name', 'colour name']) },
      { label: 'Material', collected: hasSpecValue(specPairs, ['material', 'material type', 'base material', 'secondary material']) },
      { label: 'Unit Count', collected: hasText(record.unitCount) || hasSpecValue(specPairs, UNIT_COUNT_SPEC_LABELS) },
      { label: 'Size/Dimensions', collected: hasSpecValue(specPairs, ['size', 'size name', 'composition', 'fabric', 'product dimensions', 'item dimensions']) }
    ]
  }
  return [
    { label: '英文标题', collected: hasText(record.sourceTitle) },
    { label: '中文名', collected: hasText(record.sourceTitleCn) },
    { label: '阿语标题', collected: hasText(record.sourceTitleAr) },
    { label: '主图', collected: hasText(record.sourceImageUrl) },
    { label: '商品图片', collected: Boolean(record.imageUrls?.length) },
    { label: '价格', collected: hasText(record.priceSummary) },
    { label: '规格线索', collected: Boolean(record.specHints?.length) },
    { label: '源头链接', collected: hasText(record.pageUrl) || hasText(record.sourceUrl) }
  ]
}

const UNIT_COUNT_SPEC_LABELS = [
  'unit count',
  'item quantity',
  'item qty',
  'number of pieces',
  'quantity',
  'qty',
  'package quantity',
  'pieces',
  'piece count'
]

function deriveDurationSeconds(startedAt?: string, finishedAt?: string) {
  if (!startedAt || !finishedAt) {
    return undefined
  }
  const started = dayjs(startedAt)
  const finished = dayjs(finishedAt)
  if (!started.isValid() || !finished.isValid()) {
    return undefined
  }
  return finished.diff(started, 'second')
}

function parseSpecPairs(specHints?: string[]): SpecPair[] {
  return (specHints || [])
    .map((text) => {
      const separatorIndex = text ? Math.max(text.indexOf(':'), text.indexOf('：')) : -1
      if (separatorIndex <= 0) {
        return null
      }
      const label = text.slice(0, separatorIndex).trim()
      const value = text.slice(separatorIndex + 1).trim()
      if (!label || !value) {
        return null
      }
      return { label, value, text }
    })
    .filter((pair): pair is SpecPair => Boolean(pair))
}

function hasText(value?: string) {
  return Boolean(value?.trim())
}

function hasSpecValue(specPairs: SpecPair[], labels: string[]) {
  const normalizedLabels = new Set(labels.map(normalizeSpecLabel))
  return specPairs.some((pair) => normalizedLabels.has(normalizeSpecLabel(pair.label)) && hasText(pair.value))
}

function normalizeSpecLabel(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function hasAmazonAsin(record: ProductSelectionSourceCollection, specPairs: SpecPair[]) {
  const urlText = `${record.pageUrl || ''} ${record.sourceUrl || ''}`
  return /\b[A-Z0-9]{10}\b/i.test(urlText) || hasSpecValue(specPairs, ['asin'])
}

function hasNoonSku(record: ProductSelectionSourceCollection, specPairs: SpecPair[]) {
  const urlText = `${record.pageUrl || ''} ${record.sourceUrl || ''}`
  return /\b[NPZ][A-Z0-9]{8,}\b/i.test(urlText) || hasSpecValue(specPairs, ['noon sku', 'sku'])
}

function hasSheinProductId(record: ProductSelectionSourceCollection, specPairs: SpecPair[]) {
  const urlText = `${record.pageUrl || ''} ${record.sourceUrl || ''}`
  return /-p-\d+\.html/i.test(urlText) || hasSpecValue(specPairs, ['shein product id', 'shein sku', 'sku', 'goods sn', 'goods id'])
}

function hasRating(specPairs: SpecPair[]) {
  return specPairs.some((pair) => {
    if (!['rating', 'customer reviews'].includes(normalizeSpecLabel(pair.label))) {
      return false
    }
    const value = pair.value.toLowerCase()
    return value.includes('out of 5') || /\d+(\.\d+)?/.test(value)
  })
}

function hasReviewCount(specPairs: SpecPair[]) {
  return specPairs.some((pair) => {
    if (!['review count', 'customer reviews'].includes(normalizeSpecLabel(pair.label))) {
      return false
    }
    const value = pair.value.toLowerCase()
    return value.includes('review') || /\d{2,}/.test(value)
  })
}

function hasEnglishSummary(value?: string) {
  return /[A-Za-z]{3,}/.test(value || '')
}
