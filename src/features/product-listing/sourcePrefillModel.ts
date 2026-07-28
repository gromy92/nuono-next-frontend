import type { ProductCompetitorContentMaterial } from '../product-domain/productCompetitorContent'
import type { ProductSelectionSourceCollection } from '../source-collection/types'

export type ManualSelectionListingCompetitor = {
  id?: string
  url?: string
  note?: string
  fetchedTitle?: string
  fetchedTitleAr?: string
  fetchedDescriptionEn?: string
  fetchedDescriptionAr?: string
  fetchedSellingPointsEn?: string[]
  fetchedSellingPointsAr?: string[]
  fetchedSourceHost?: string
  fetchedCategoryName?: string
  fetchedCategoryPath?: string
  fetchedCategoryUrl?: string
  fetchedCategoryLinks?: Array<{
    name?: string
    path?: string
    url?: string
  }>
  fetchedAt?: string
  fetchStatus?: string
}

export function normalizeCompetitorMaterials(competitors: ManualSelectionListingCompetitor[]): ProductCompetitorContentMaterial[] {
  return competitors
    .filter((competitor) => competitor.fetchStatus === 'success')
    .map((competitor, index) => ({
      id: text(competitor.id) || `competitor-${index + 1}`,
      url: text(competitor.url),
      note: text(competitor.note),
      sourceHost: text(competitor.fetchedSourceHost),
      fetchedAt: text(competitor.fetchedAt),
      categoryName: text(competitor.fetchedCategoryName),
      categoryPath: text(competitor.fetchedCategoryPath),
      categoryUrl: text(competitor.fetchedCategoryUrl),
      categoryLinks: normalizeCompetitorCategoryLinks(competitor.fetchedCategoryLinks),
      titleEn: text(competitor.fetchedTitle),
      titleAr: text(competitor.fetchedTitleAr),
      descriptionEn: text(competitor.fetchedDescriptionEn),
      descriptionAr: text(competitor.fetchedDescriptionAr),
      sellingPointsEn: uniqueTexts(competitor.fetchedSellingPointsEn || []),
      sellingPointsAr: uniqueTexts(competitor.fetchedSellingPointsAr || [])
    }))
    .filter(hasCompetitorContent)
}

export function sourceRecordToCompetitorMaterial(record: ProductSelectionSourceCollection): ProductCompetitorContentMaterial {
  return {
    id: text(record.id),
    url: text(record.pageUrl || record.sourceUrl),
    note: text(record.sourceTitleCn || record.selectedText || record.notes),
    sourceHost: text(record.sourcePlatform),
    fetchedAt: text(record.collectedAt),
    categoryName: text(record.categoryName),
    categoryPath: text(record.categoryPath),
    categoryUrl: text(record.categoryUrl),
    categoryLinks: normalizeCompetitorCategoryLinks(record.categoryLinks),
    titleEn: text(record.sourceTitle),
    titleAr: text(record.sourceTitleAr || record.selectedTextAr),
    descriptionEn: text(record.sourceDescriptionEn),
    descriptionAr: text(record.sourceDescriptionAr || record.selectedTextAr),
    sellingPointsEn: uniqueTexts(record.sourceSellingPointsEn || []),
    sellingPointsAr: uniqueTexts(record.sourceSellingPointsAr || [])
  }
}

export function hasCompetitorContent(material: ProductCompetitorContentMaterial) {
  return (
    Boolean(material.titleEn || material.titleAr || material.descriptionEn || material.descriptionAr)
    || Boolean(material.sellingPointsEn?.length || material.sellingPointsAr?.length)
    || Boolean(material.categoryName || material.categoryPath || material.categoryUrl || material.categoryLinks?.length)
  )
}

export function normalizeDraftCompetitorMaterials(value: unknown): ProductCompetitorContentMaterial[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value
    .filter(recordValue)
    .map((material, index) => ({
      id: text(stringValue(material.id)) || `competitor-${index + 1}`,
      url: text(stringValue(material.url)),
      note: text(stringValue(material.note)),
      sourceHost: text(stringValue(material.sourceHost)),
      externalSku: text(stringValue(material.externalSku)),
      fetchedAt: text(stringValue(material.fetchedAt)),
      categoryName: text(stringValue(material.categoryName)),
      categoryPath: text(stringValue(material.categoryPath)),
      categoryUrl: text(stringValue(material.categoryUrl)),
      categoryLinks: normalizeCompetitorCategoryLinks(material.categoryLinks),
      titleEn: text(stringValue(material.titleEn)),
      titleAr: text(stringValue(material.titleAr)),
      descriptionEn: text(stringValue(material.descriptionEn)),
      descriptionAr: text(stringValue(material.descriptionAr)),
      sellingPointsEn: uniqueTexts(arrayStringValues(material.sellingPointsEn)),
      sellingPointsAr: uniqueTexts(arrayStringValues(material.sellingPointsAr))
    }))
    .filter(hasCompetitorContent)
}

export function normalizeCompetitorCategoryLinks(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }
  return value
    .filter(recordValue)
    .map((item) => ({
      name: text(stringValue(item.name)),
      path: text(stringValue(item.path)),
      url: text(stringValue(item.url))
    }))
    .filter((item) => item.name || item.path || item.url)
}

export function uniqueTexts(values: Array<string | undefined>) {
  return values.map(text).filter((value, index, list) => value && list.indexOf(value) === index)
}

export function firstText(values: Array<string | undefined>) {
  return values.map(text).find(Boolean) || ''
}

export function text(value?: string) {
  return (value || '').trim()
}

export function stringValue(value: unknown) {
  return typeof value === 'string' ? value : undefined
}

export function firstOfficialNoonFulltype(values: Array<string | undefined>) {
  return values.map((value) => text(value)).find(isOfficialNoonFulltypeCode) || ''
}

export function officialNoonFulltypeOrEmpty(value: string | undefined) {
  const normalized = text(value)
  return isOfficialNoonFulltypeCode(normalized) ? normalized : ''
}

export function isOfficialNoonFulltypeCode(value: string) {
  return /^[a-z0-9_]+-[a-z0-9_]+-[a-z0-9_]+$/.test(value)
}

export function recordValue(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined
  }
  return value as Record<string, unknown>
}

export function numberFromPriceSummary(value?: string) {
  const normalized = text(value).replace(/,/g, '')
  const match = normalized.match(/\d+(?:\.\d+)?/)
  if (!match) {
    return undefined
  }
  const parsed = Number(match[0])
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

export function numericSourceRefId(value?: string) {
  const normalized = text(value)
  if (!/^\d+$/.test(normalized)) {
    return undefined
  }
  const numeric = Number(normalized)
  return Number.isSafeInteger(numeric) && numeric > 0 ? numeric : undefined
}

export function finitePositiveNumber(value?: number) {
  return Number.isFinite(value) && Number(value) > 0 ? Number(value) : undefined
}

function arrayStringValues(value: unknown) {
  return Array.isArray(value) ? value.map((item) => stringValue(item)).filter(Boolean) : []
}
