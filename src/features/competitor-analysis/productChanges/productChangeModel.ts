import { buildNoonProductDetailUrl } from '../competitorNoonLinks'
import {
  formatRankStatus,
  normalizeNoonProductCode
} from '../competitorRankFormatting'
import type {
  CompetitorProductChangeField,
  CompetitorProductChangeGroup,
  CompetitorRankPoint,
  CompetitorWatchProduct
} from '../types'

export type ProductChangeDateGroup = {
  factDate: string
  changes: CompetitorProductChangeField[]
}

export type ProductChangeCompetitorCardView = {
  noonProductCode: string
  productName: string
  imageUrl?: string
  canonicalUrl?: string
  subjectType: CompetitorProductChangeGroup['subjectType']
  dateGroups: ProductChangeDateGroup[]
}

export function buildProductChangeCompetitorCards(
  product: CompetitorWatchProduct,
  groups: CompetitorProductChangeGroup[]
): ProductChangeCompetitorCardView[] {
  const candidateByCode = new Map(
    product.candidates.map((candidate) => [normalizeNoonProductCode(candidate.noonProductCode), candidate])
  )
  const cardByCode = new Map<string, ProductChangeCompetitorCardView>()

  groups.forEach((group) => {
    const normalizedCode = normalizeNoonProductCode(group.noonProductCode)
    if (!normalizedCode) return
    const candidate = candidateByCode.get(normalizedCode)
    const card = cardByCode.get(normalizedCode) ?? {
      noonProductCode: group.noonProductCode,
      productName: candidate?.title || group.productName || group.noonProductCode,
      imageUrl: candidate?.imageUrl,
      canonicalUrl: candidate?.canonicalUrl
        || buildNoonProductDetailUrl(group.noonProductCode, product.siteCode),
      subjectType: group.subjectType,
      dateGroups: []
    }
    const visibleChanges = displayProductChanges(group.changes)
    if (!visibleChanges.length) return
    const dateGroup = card.dateGroups.find((item) => item.factDate === group.factDate)
    if (dateGroup) {
      dateGroup.changes.push(...visibleChanges)
    } else {
      card.dateGroups.push({ factDate: group.factDate, changes: visibleChanges })
    }
    cardByCode.set(normalizedCode, card)
  })

  return Array.from(cardByCode.values())
    .map((card) => ({
      ...card,
      dateGroups: card.dateGroups
        .map((dateGroup) => ({
          ...dateGroup,
          changes: dateGroup.changes.slice().sort(compareProductChangeFields)
        }))
        .sort((left, right) => right.factDate.localeCompare(left.factDate))
    }))
    .sort((left, right) => {
      const latestDateCompare = (right.dateGroups[0]?.factDate || '')
        .localeCompare(left.dateGroups[0]?.factDate || '')
      return latestDateCompare || left.noonProductCode.localeCompare(right.noonProductCode)
    })
}

export function buildProductChangeSummary(groups: CompetitorProductChangeGroup[]) {
  const groupsWithChanges = groups
    .map((group) => ({ ...group, changes: displayProductChanges(group.changes) }))
    .filter((group) => group.changes.length)
  const allChanges = groupsWithChanges.flatMap((group) => group.changes)
  return {
    changedDays: new Set(groupsWithChanges.map((group) => group.factDate)).size,
    fieldChanges: allChanges.length,
    priceChanges: allChanges.filter((change) => change.fieldKey === 'price').length,
    imageChanges: allChanges.filter((change) => productChangeFieldKey(change.fieldKey) === 'mainImage').length
  }
}

export function formatSnapshotDate(value?: string) {
  return value ? value.slice(0, 10) : '-'
}

export function productChangeFieldColor(fieldKey: string) {
  const normalized = productChangeFieldKey(fieldKey)
  if (fieldKey === 'price') return 'orange'
  if (normalized === 'mainImage') return 'purple'
  if (normalized === 'supermallEnabled') return 'green'
  if (normalized === 'availabilityStatus') return 'red'
  return 'blue'
}

export function productChangeFieldKey(fieldKey: string) {
  if (fieldKey === 'main_image' || fieldKey === 'mainImage') return 'mainImage'
  if (fieldKey === 'supermall_enabled' || fieldKey === 'supermallEnabled') return 'supermallEnabled'
  if (fieldKey === 'availability_status' || fieldKey === 'availabilityStatus') return 'availabilityStatus'
  return fieldKey
}

export function formatProductChangeContent(change: CompetitorProductChangeField) {
  return `${formatProductChangeValue(change.oldValue)} → ${formatProductChangeValue(change.newValue)}`
}

export function buildNoonImageAssetUrl(value: unknown, peerValue?: unknown) {
  const rawValue = productChangeAssetValue(value)
  if (!rawValue || rawValue === '-') return ''
  if (/^https?:\/\//i.test(rawValue)) return rawValue
  const normalized = normalizeNoonImageAssetPath(rawValue, productChangeAssetValue(peerValue))
  return normalized ? `https://f.nooncdn.com/p/${encodeURI(normalized)}` : ''
}

export function buildProductChangeRankItems(
  product: CompetitorWatchProduct,
  noonProductCode: string,
  factDate: string
) {
  const points = selectProductChangeRankPoints(product, noonProductCode, factDate)
  const keywordById = new Map(product.keywords.map((keyword) => [keyword.id, keyword.keyword]))
  return points.map((point) => ({
    keyword: keywordById.get(point.keywordId) || '关键词',
    channel: point.rankChannel === 'sponsored' ? '广告' : '自然',
    status: formatRankStatus(point)
  }))
}

export function formatProductChangeValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'boolean') return value ? '是' : '否'
  if (typeof value === 'number' || typeof value === 'string') return String(value)
  if (Array.isArray(value)) {
    return value.length ? value.map(formatProductChangeValue).join('、') : '-'
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    if ('amount' in record || 'currency' in record) {
      return `${record.amount ?? '-'} ${record.currency ?? ''}`.trim()
    }
    if ('assetKey' in record) return String(record.assetKey || '-')
    if ('normalizedUrl' in record) return String(record.normalizedUrl || '-')
    return JSON.stringify(value)
  }
  return String(value)
}

function displayProductChanges(changes: CompetitorProductChangeField[]) {
  return changes.filter((change) =>
    isListFieldChange(change)
      && !isSameResolvedMainImageChange(change)
  )
}

function isListFieldChange(change: CompetitorProductChangeField) {
  return [
    'title',
    'titleAr',
    'tags',
    'price',
    'currency',
    'mainImage'
  ].includes(productChangeFieldKey(change.fieldKey))
}

function isSameResolvedMainImageChange(change: CompetitorProductChangeField) {
  if (productChangeFieldKey(change.fieldKey) !== 'mainImage') return false
  const oldUrl = buildNoonImageAssetUrl(change.oldValue, change.newValue)
  const newUrl = buildNoonImageAssetUrl(change.newValue, change.oldValue)
  return Boolean(oldUrl && newUrl && oldUrl === newUrl)
}

function compareProductChangeFields(
  left: CompetitorProductChangeField,
  right: CompetitorProductChangeField
) {
  const order = ['mainImage', 'price', 'currency', 'title', 'titleAr', 'tags']
  const leftOrder = order.indexOf(productChangeFieldKey(left.fieldKey))
  const rightOrder = order.indexOf(productChangeFieldKey(right.fieldKey))
  const normalizedLeftOrder = leftOrder >= 0 ? leftOrder : order.length
  const normalizedRightOrder = rightOrder >= 0 ? rightOrder : order.length
  return normalizedLeftOrder !== normalizedRightOrder
    ? normalizedLeftOrder - normalizedRightOrder
    : left.fieldLabel.localeCompare(right.fieldLabel)
}

function normalizeNoonImageAssetPath(value: string, peerValue?: string) {
  const path = value.replace(/^\/+/, '').trim()
  if (!path) return ''
  const peerPath = (peerValue || '').replace(/^\/+/, '').trim()
  const extension = noonImageAssetExtension(path) || noonImageAssetExtension(peerPath) || '.jpg'
  if (path.includes('/')) return noonImageAssetHasExtension(path) ? path : `${path}${extension}`
  if (peerPath.includes('/') && assetStem(noonImageAssetBaseName(peerPath)) === assetStem(path)) {
    const directory = peerPath.slice(0, peerPath.lastIndexOf('/') + 1)
    return `${directory}${noonImageAssetHasExtension(path) ? path : `${path}${extension}`}`
  }
  return noonImageAssetHasExtension(path) ? path : `${path}${extension}`
}

function noonImageAssetBaseName(path: string) {
  return path.split(/[?#]/)[0].split('/').filter(Boolean).pop() || ''
}

function assetStem(value: string) {
  return noonImageAssetBaseName(value).replace(/\.(?:jpe?g|png|webp|gif|avif)$/i, '')
}

function noonImageAssetExtension(path: string) {
  return noonImageAssetBaseName(path).match(/\.(?:jpe?g|png|webp|gif|avif)$/i)?.[0] || ''
}

function noonImageAssetHasExtension(path: string) {
  return Boolean(noonImageAssetExtension(path))
}

function productChangeAssetValue(value: unknown): string {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as Record<string, unknown>
    const candidate = record.url ?? record.imageUrl ?? record.assetUrl ?? record.normalizedUrl
      ?? record.assetKey ?? record.path ?? record.key
    if (candidate !== undefined && candidate !== null && candidate !== '') {
      return formatProductChangeValue(candidate).trim()
    }
  }
  return formatProductChangeValue(value).trim()
}

function selectProductChangeRankPoints(
  product: CompetitorWatchProduct,
  noonProductCode: string,
  factDate: string
) {
  const normalizedCode = normalizeNoonProductCode(noonProductCode)
  const points = product.rankPoints.filter(
    (point) => !point.isSelf && normalizeNoonProductCode(point.noonProductCode) === normalizedCode
  )
  return latestRankPointsByKeywordChannel(
    points.filter((point) => point.factDate === factDate)
  ).length
    ? latestRankPointsByKeywordChannel(points.filter((point) => point.factDate === factDate))
    : latestRankPointsByKeywordChannel(points.filter((point) => point.factDate <= factDate))
}

function latestRankPointsByKeywordChannel(points: CompetitorRankPoint[]) {
  const pointByKey = new Map<string, CompetitorRankPoint>()
  points.forEach((point) => {
    const key = `${point.keywordId}:${point.rankChannel || 'organic'}`
    const existing = pointByKey.get(key)
    if (!existing || point.factDate.localeCompare(existing.factDate) > 0) {
      pointByKey.set(key, point)
    }
  })
  return Array.from(pointByKey.values()).sort((left, right) => {
    const keywordCompare = left.keywordId.localeCompare(right.keywordId)
    return keywordCompare
      || (left.rankChannel || 'organic').localeCompare(right.rankChannel || 'organic')
  })
}
