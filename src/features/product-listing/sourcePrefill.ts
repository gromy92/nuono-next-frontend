import type { ProductSelectionSourceCollection } from '../source-collection/types'
import type { ProductCompetitorContentMaterial } from '../product-management/types/competitorContent'
import type {
  ManualSelectionAnalysisProjectView,
  ManualSelectionGroupView,
  ManualSelectionGroupProfitEstimateSnapshot
} from '../manual-selection/types'
import type { ProductListingEditorDraft } from './productDetailAdapter'

const PRODUCT_LISTING_SOURCE_PREFILL_STORAGE_KEY = 'nuono:product-listing:source-prefill'

type PreOrderProfitListingPrefillCandidate = {
  id: string
  storeCode?: string
  title: string
  skuHint: string
  purchaseUrl: string
  purchasePriceRmb: number
  salePrice: number
  categoryLabel?: string
  logisticsCarrierLabel?: string
}

export type ProductListingSourcePrefill = {
  source: 'manual-selection' | 'pre-order-profit'
  sourceCollectionId?: string
  sourceGroupId?: string
  sourceGroupNo?: string
  sourceCandidateId?: string
  pendingServerHydration?: boolean
  collectionNo?: string
  sourcePlatform?: string
  sourceTitleCn?: string
  sourceUrl?: string
  competitorMaterials?: ProductCompetitorContentMaterial[]
  draft: Partial<ProductListingEditorDraft>
}

type ManualSelectionListingCompetitor = {
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
  fetchedAt?: string
  fetchStatus?: string
}

export function saveManualSelectionListingPrefill(
  record: ProductSelectionSourceCollection,
  storeCode?: string,
  competitors: ManualSelectionListingCompetitor[] = []
) {
  const prefill = buildManualSelectionListingPrefill(record, storeCode, competitors)
  window.sessionStorage.setItem(PRODUCT_LISTING_SOURCE_PREFILL_STORAGE_KEY, JSON.stringify(prefill))
}

export function saveManualSelectionGroupListingPrefill(
  project: ManualSelectionAnalysisProjectView,
  storeCode?: string,
  competitors: ManualSelectionListingCompetitor[] = [],
  profitEstimate?: ManualSelectionGroupProfitEstimateSnapshot | null
) {
  const prefill = buildManualSelectionGroupListingPrefill(project, storeCode, competitors, profitEstimate)
  window.sessionStorage.setItem(PRODUCT_LISTING_SOURCE_PREFILL_STORAGE_KEY, JSON.stringify(prefill))
}

export function savePreOrderProfitListingPrefill(
  candidate: PreOrderProfitListingPrefillCandidate,
  storeCode?: string
) {
  const prefill = buildPreOrderProfitListingPrefill(candidate, storeCode)
  window.sessionStorage.setItem(PRODUCT_LISTING_SOURCE_PREFILL_STORAGE_KEY, JSON.stringify(prefill))
}

export function readProductListingSourcePrefill() {
  if (typeof window === 'undefined') {
    return undefined
  }

  const search = new URLSearchParams(window.location.search)
  const listingSource = search.get('listingSource')
  if (listingSource !== 'manual-selection' && listingSource !== 'pre-order-profit') {
    return undefined
  }
  const sourceId =
    listingSource === 'manual-selection'
      ? search.get('selectionGroupId') || search.get('sourceCollectionId') || ''
      : search.get('sourceCandidateId') || ''
  if (!sourceId) {
    return undefined
  }

  const rawValue = window.sessionStorage.getItem(PRODUCT_LISTING_SOURCE_PREFILL_STORAGE_KEY)
  if (!rawValue) {
    return manualSelectionGroupLocatorPrefill(search)
  }

  try {
    const parsed = JSON.parse(rawValue) as ProductListingSourcePrefill
    if (parsed.source !== listingSource) {
      return manualSelectionGroupLocatorPrefill(search)
    }
    const parsedSourceId = parsed.source === 'manual-selection'
      ? parsed.sourceGroupId || parsed.sourceCollectionId
      : parsed.sourceCandidateId
    if (parsedSourceId !== sourceId) {
      return manualSelectionGroupLocatorPrefill(search)
    }
    return parsed
  } catch {
    return manualSelectionGroupLocatorPrefill(search)
  }
}

function manualSelectionGroupLocatorPrefill(search: URLSearchParams): ProductListingSourcePrefill | undefined {
  if (search.get('listingSource') !== 'manual-selection') {
    return undefined
  }
  const sourceGroupId = text(search.get('selectionGroupId') || '')
  if (!sourceGroupId) {
    return undefined
  }
  return {
    source: 'manual-selection',
    sourceGroupId,
    pendingServerHydration: true,
    draft: {}
  }
}

function buildManualSelectionListingPrefill(
  record: ProductSelectionSourceCollection,
  storeCode?: string,
  competitors: ManualSelectionListingCompetitor[] = []
): ProductListingSourcePrefill {
  const sourceRefId = numericSourceRefId(record.id)
  return {
    source: 'manual-selection',
    sourceCollectionId: record.id,
    collectionNo: record.collectionNo,
    sourcePlatform: record.sourcePlatform,
    sourceTitleCn: record.sourceTitleCn || record.selectedText,
    sourceUrl: record.pageUrl || record.sourceUrl,
    competitorMaterials: normalizeCompetitorMaterials(competitors),
    draft: {
      storeCode: record.storeCode || storeCode || '',
      productTitleCn: text(record.sourceTitleCn || record.selectedText),
      productTitleEn: text(record.sourceTitle),
      productTitleAr: text(record.sourceTitleAr),
      productDescriptionEn: text(record.sourceDescriptionEn),
      productDescriptionAr: text(record.sourceDescriptionAr || record.selectedTextAr),
      productHighlightsEn: uniqueTexts(record.sourceSellingPointsEn || []),
      productHighlightsAr: uniqueTexts(record.sourceSellingPointsAr || []),
      productBrand: text(record.brandName),
      imageUrls: uniqueTexts([record.sourceImageUrl, ...(record.imageUrls || [])]),
      price: numberFromPriceSummary(record.priceSummary),
      supplyEvidenceType: 'OTHER',
      supplyEvidenceRefId: sourceRefId,
      sourceType: 'manual_selection',
      sourceRefId
    }
  }
}

export function buildManualSelectionGroupListingPrefill(
  project: ManualSelectionAnalysisProjectView,
  storeCode?: string,
  competitors: ManualSelectionListingCompetitor[] = [],
  profitEstimate?: ManualSelectionGroupProfitEstimateSnapshot | null
): ProductListingSourcePrefill {
  const records = (project.records || []).filter(Boolean)
  const sourceGroupId = text(project.groupId || project.projectId)
  const sourceRefId = numericSourceRefId(sourceGroupId) ?? numericSourceRefId(project.projectId)
  const titleCn = text(project.projectName)
  const productFullType = productFullTypeFromManualSelectionProfitEstimate(profitEstimate)
  const firstCollectionNo = firstText(records.map((record) => record.collectionNo))
  return {
    source: 'manual-selection',
    sourceGroupId,
    sourceGroupNo: project.groupNo,
    collectionNo: project.groupNo || firstCollectionNo,
    sourcePlatform: uniqueTexts(records.map((record) => record.sourcePlatform)).join(' / '),
    sourceTitleCn: titleCn,
    competitorMaterials: [
      ...records.map(sourceRecordToCompetitorMaterial),
      ...normalizeCompetitorMaterials(competitors)
    ].filter(hasCompetitorContent),
    draft: {
      storeCode: firstText(records.map((record) => record.storeCode)) || storeCode || '',
      productTitleCn: titleCn,
      productTitleEn: firstText(records.map((record) => record.sourceTitle)),
      productTitleAr: firstText(records.map((record) => record.sourceTitleAr || record.selectedTextAr)),
      productDescriptionEn: firstText(records.map((record) => record.sourceDescriptionEn)),
      productDescriptionAr: firstText(records.map((record) => record.sourceDescriptionAr || record.selectedTextAr)),
      productHighlightsEn: uniqueTexts(records.flatMap((record) => record.sourceSellingPointsEn || [])),
      productHighlightsAr: uniqueTexts(records.flatMap((record) => record.sourceSellingPointsAr || [])),
      productBrand: firstText(records.map((record) => record.brandName)),
      productFullType,
      imageUrls: uniqueTexts(records.flatMap((record) => [record.sourceImageUrl, ...(record.imageUrls || [])])),
      price: numberFromPriceSummary(firstText(records.map((record) => record.priceSummary))),
      purchasePrice: finitePositiveNumber(project.procurement?.purchasePriceRmb ?? project.procurement?.purchasePrice),
      supplyEvidenceType: 'OTHER',
      supplyEvidenceRefId: sourceRefId,
      sourceType: 'manual_selection_group',
      sourceRefId
    }
  }
}

export function buildManualSelectionGroupListingPrefillFromGroup(
  group: ManualSelectionGroupView,
  storeCode?: string,
  profitEstimate?: ManualSelectionGroupProfitEstimateSnapshot | null
): ProductListingSourcePrefill {
  const records = (group.materials || [])
    .map((material) => material.sourceCollection)
    .filter((record): record is ProductSelectionSourceCollection => Boolean(record))
  const project: ManualSelectionAnalysisProjectView = {
    projectId: group.groupId,
    groupId: group.groupId,
    groupNo: group.groupNo,
    projectName: group.groupName,
    projectMaterialCount: group.materialCount ?? records.length,
    procurement: group.procurement,
    competitors: group.competitors || [],
    items: [],
    records
  }
  return buildManualSelectionGroupListingPrefill(project, storeCode, group.competitors || [], profitEstimate)
}

export function productFullTypeFromManualSelectionProfitEstimate(
  profitEstimate?: ManualSelectionGroupProfitEstimateSnapshot | null
) {
  const snapshot = recordValue(profitEstimate?.snapshot)
  const selectedCategory = recordValue(snapshot?.selectedCategory)
  const formValues = recordValue(snapshot?.formValues)
  return firstText([
    stringValue(selectedCategory?.value),
    stringValue(selectedCategory?.label),
    stringValue(formValues?.categoryKey)
  ])
}

function buildPreOrderProfitListingPrefill(
  candidate: PreOrderProfitListingPrefillCandidate,
  storeCode?: string
): ProductListingSourcePrefill {
  const sourceRefId = numericSourceRefId(candidate.id)
  return {
    source: 'pre-order-profit',
    sourceCandidateId: candidate.id,
    sourcePlatform: '选品池',
    sourceTitleCn: candidate.title,
    sourceUrl: candidate.purchaseUrl,
    draft: {
      storeCode: candidate.storeCode || storeCode || '',
      psku: text(candidate.skuHint),
      productTitleCn: text(candidate.title),
      price: finitePositiveNumber(candidate.salePrice),
      salePrice: finitePositiveNumber(candidate.salePrice),
      purchasePrice: finitePositiveNumber(candidate.purchasePriceRmb),
      supplyEvidenceType: 'OTHER',
      supplyEvidenceRefId: sourceRefId,
      sourceType: 'pre_order_profit',
      sourceRefId,
      offerNote: buildPreOrderProfitOfferNote(candidate)
    }
  }
}

function normalizeCompetitorMaterials(competitors: ManualSelectionListingCompetitor[]): ProductCompetitorContentMaterial[] {
  return competitors
    .filter((competitor) => competitor.fetchStatus === 'success')
    .map((competitor, index) => ({
      id: text(competitor.id) || `competitor-${index + 1}`,
      url: text(competitor.url),
      note: text(competitor.note),
      sourceHost: text(competitor.fetchedSourceHost),
      fetchedAt: text(competitor.fetchedAt),
      titleEn: text(competitor.fetchedTitle),
      titleAr: text(competitor.fetchedTitleAr),
      descriptionEn: text(competitor.fetchedDescriptionEn),
      descriptionAr: text(competitor.fetchedDescriptionAr),
      sellingPointsEn: uniqueTexts(competitor.fetchedSellingPointsEn || []),
      sellingPointsAr: uniqueTexts(competitor.fetchedSellingPointsAr || [])
    }))
    .filter((material) => (
      Boolean(material.titleEn || material.titleAr || material.descriptionEn || material.descriptionAr)
        || Boolean(material.sellingPointsEn?.length || material.sellingPointsAr?.length)
    ))
}

function sourceRecordToCompetitorMaterial(record: ProductSelectionSourceCollection): ProductCompetitorContentMaterial {
  return {
    id: text(record.id),
    url: text(record.pageUrl || record.sourceUrl),
    note: text(record.sourceTitleCn || record.selectedText || record.notes),
    sourceHost: text(record.sourcePlatform),
    fetchedAt: text(record.collectedAt),
    titleEn: text(record.sourceTitle),
    titleAr: text(record.sourceTitleAr || record.selectedTextAr),
    descriptionEn: text(record.sourceDescriptionEn),
    descriptionAr: text(record.sourceDescriptionAr || record.selectedTextAr),
    sellingPointsEn: uniqueTexts(record.sourceSellingPointsEn || []),
    sellingPointsAr: uniqueTexts(record.sourceSellingPointsAr || [])
  }
}

function hasCompetitorContent(material: ProductCompetitorContentMaterial) {
  return (
    Boolean(material.titleEn || material.titleAr || material.descriptionEn || material.descriptionAr)
    || Boolean(material.sellingPointsEn?.length || material.sellingPointsAr?.length)
  )
}

function uniqueTexts(values: Array<string | undefined>) {
  return values.map(text).filter((value, index, list) => value && list.indexOf(value) === index)
}

function firstText(values: Array<string | undefined>) {
  return values.map(text).find(Boolean) || ''
}

function text(value?: string) {
  return (value || '').trim()
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value : undefined
}

function recordValue(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined
  }
  return value as Record<string, unknown>
}

function numberFromPriceSummary(value?: string) {
  const normalized = text(value).replace(/,/g, '')
  const match = normalized.match(/\d+(?:\.\d+)?/)
  if (!match) {
    return undefined
  }
  const parsed = Number(match[0])
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function numericSourceRefId(value?: string) {
  const normalized = text(value)
  if (!/^\d+$/.test(normalized)) {
    return undefined
  }
  const numeric = Number(normalized)
  return Number.isSafeInteger(numeric) && numeric > 0 ? numeric : undefined
}

function finitePositiveNumber(value?: number) {
  return Number.isFinite(value) && Number(value) > 0 ? Number(value) : undefined
}

function buildPreOrderProfitOfferNote(candidate: PreOrderProfitListingPrefillCandidate) {
  const parts = [
    `选品池: ${text(candidate.skuHint) || text(candidate.id)}`,
    candidate.categoryLabel ? `类目 ${candidate.categoryLabel}` : undefined,
    candidate.logisticsCarrierLabel ? `物流 ${candidate.logisticsCarrierLabel}` : undefined
  ].filter(Boolean)
  return parts.join(' / ')
}
