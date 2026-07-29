import type { ProductSelectionSourceCollection } from '../source-collection/types'
import type { ProductCompetitorContentMaterial } from '../product-domain/productCompetitorContent'
import type {
  ManualSelectionAnalysisProjectView,
  ManualSelectionGroupView,
  ManualSelectionGroupProfitEstimateSnapshot
} from '../selection-analysis/types'
import type { ProductListingEditorDraft } from './productDetailAdapter'
import { readProductListingSourcePrefillFromSession, saveProductListingSourcePrefillToSession } from './productListingSourcePrefillStorage'
import type { ProductListingDraftView } from './types'
import {
  finitePositiveNumber,
  firstOfficialNoonFulltype,
  firstText,
  hasCompetitorContent,
  normalizeCompetitorMaterials,
  normalizeDraftCompetitorMaterials,
  numberFromPriceSummary,
  numericSourceRefId,
  officialNoonFulltypeOrEmpty,
  recordValue,
  sourceRecordToCompetitorMaterial,
  stringValue,
  text,
  uniqueTexts,
  type ManualSelectionListingCompetitor
} from './sourcePrefillModel'

export type ProductListingSourcePrefill = {
  source: 'manual-selection' | 'listing-draft'
  sourceGroupId?: string
  sourceGroupNo?: string
  sourceDraftId?: string
  pendingServerHydration?: boolean
  collectionNo?: string
  sourcePlatform?: string
  sourceTitleCn?: string
  sourceUrl?: string
  competitorMaterials?: ProductCompetitorContentMaterial[]
  draft: Partial<ProductListingEditorDraft>
}

export function saveManualSelectionGroupListingPrefill(
  project: ManualSelectionAnalysisProjectView,
  storeCode?: string,
  competitors: ManualSelectionListingCompetitor[] = [],
  profitEstimate?: ManualSelectionGroupProfitEstimateSnapshot | null
) {
  const prefill = buildManualSelectionGroupListingPrefill(project, storeCode, competitors, profitEstimate)
  saveProductListingSourcePrefillToSession(prefill)
}

export function saveProductListingDraftRecoveryPrefill(draftView: ProductListingDraftView) {
  const prefill = buildProductListingDraftRecoveryPrefill(draftView)
  saveProductListingSourcePrefillToSession(prefill)
}

export function readProductListingSourcePrefill() {
  if (typeof window === 'undefined') {
    return undefined
  }

  const search = new URLSearchParams(window.location.search)
  const listingSource = search.get('listingSource')
  if (listingSource !== 'manual-selection' && listingSource !== 'listing-draft') {
    return undefined
  }
  const sourceId =
    listingSource === 'manual-selection'
      ? search.get('selectionGroupId') || ''
      : search.get('listingDraftId') || ''
  if (!sourceId) {
    return undefined
  }
  if (listingSource === 'listing-draft') {
    return listingDraftLocatorPrefill(search)
  }

  const rawValue = readProductListingSourcePrefillFromSession()
  if (!rawValue) {
    return sourceLocatorPrefill(search)
  }

  try {
    const parsed = JSON.parse(rawValue) as ProductListingSourcePrefill
    if (parsed.source !== listingSource) {
      return sourceLocatorPrefill(search)
    }
    const parsedSourceId = sourcePrefillId(parsed)
    if (parsedSourceId !== sourceId) {
      return sourceLocatorPrefill(search)
    }
    const sanitized = sanitizeProductListingSourcePrefill(parsed, search)
    return listingSource === 'manual-selection'
      ? { ...sanitized, pendingServerHydration: true }
      : sanitized
  } catch {
    return sourceLocatorPrefill(search)
  }
}

function sourcePrefillId(prefill: ProductListingSourcePrefill) {
  if (prefill.source === 'manual-selection') {
    return prefill.sourceGroupId
  }
  return prefill.sourceDraftId
}

function sourceLocatorPrefill(search: URLSearchParams): ProductListingSourcePrefill | undefined {
  return manualSelectionGroupLocatorPrefill(search) || listingDraftLocatorPrefill(search)
}
function sanitizeProductListingSourcePrefill(prefill: ProductListingSourcePrefill, search: URLSearchParams): ProductListingSourcePrefill {
  return {
    ...prefill,
    draft: {
      ...prefill.draft,
      storeCode: text(search.get('storeCode') || '') || prefill.draft.storeCode,
      productFullType: officialNoonFulltypeOrEmpty(prefill.draft.productFullType)
    }
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
    draft: { storeCode: text(search.get('storeCode') || '') }
  }
}

function listingDraftLocatorPrefill(search: URLSearchParams): ProductListingSourcePrefill | undefined {
  if (search.get('listingSource') !== 'listing-draft') {
    return undefined
  }
  const sourceDraftId = text(search.get('listingDraftId') || '')
  if (!sourceDraftId) {
    return undefined
  }
  const draftId = Number(sourceDraftId)
  return {
    source: 'listing-draft',
    sourceDraftId,
    pendingServerHydration: true,
    draft: {
      ...(Number.isFinite(draftId) && draftId > 0 ? { draftId } : {}),
      storeCode: text(search.get('storeCode') || '')
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
  return firstOfficialNoonFulltype([
    stringValue(selectedCategory?.value),
    stringValue(formValues?.categoryKey),
    stringValue(selectedCategory?.label)
  ])
}

export function buildProductListingDraftRecoveryPrefill(
  draftView: ProductListingDraftView
): ProductListingSourcePrefill {
  const draft: Partial<ProductListingEditorDraft> = draftView.draft || {
    storeCode: draftView.storeCode,
    psku: '',
    imageUrls: []
  }
  const competitorMaterials = normalizeDraftCompetitorMaterials(draft.competitorMaterials)
  const sourceTitleCn = firstText([
    draft.productTitleCn,
    draft.productTitleEn,
    draft.productTitleAr,
    draft.psku,
    draftView.draftNo
  ])
  return {
    source: 'listing-draft',
    sourceDraftId: String(draftView.draftId),
    collectionNo: draftView.draftNo,
    sourcePlatform: '上架草稿',
    sourceTitleCn,
    competitorMaterials,
    draft: {
      ...draft,
      competitorMaterials,
      draftId: draftView.draftId,
      storeCode: draft.storeCode || draftView.storeCode || '',
      productFullType: officialNoonFulltypeOrEmpty(draft.productFullType)
    }
  }
}
