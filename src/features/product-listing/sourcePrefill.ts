import type { ProductSelectionSourceCollection } from '../source-collection/types'
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
  sourceCandidateId?: string
  collectionNo?: string
  sourcePlatform?: string
  sourceTitleCn?: string
  sourceUrl?: string
  draft: Partial<ProductListingEditorDraft>
}

export function saveManualSelectionListingPrefill(record: ProductSelectionSourceCollection, storeCode?: string) {
  const prefill = buildManualSelectionListingPrefill(record, storeCode)
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
      ? search.get('sourceCollectionId') || ''
      : search.get('sourceCandidateId') || ''
  if (!sourceId) {
    return undefined
  }

  const rawValue = window.sessionStorage.getItem(PRODUCT_LISTING_SOURCE_PREFILL_STORAGE_KEY)
  if (!rawValue) {
    return undefined
  }

  try {
    const parsed = JSON.parse(rawValue) as ProductListingSourcePrefill
    if (parsed.source !== listingSource) {
      return undefined
    }
    const parsedSourceId = parsed.source === 'manual-selection' ? parsed.sourceCollectionId : parsed.sourceCandidateId
    if (parsedSourceId !== sourceId) {
      return undefined
    }
    return parsed
  } catch {
    return undefined
  }
}

function buildManualSelectionListingPrefill(
  record: ProductSelectionSourceCollection,
  storeCode?: string
): ProductListingSourcePrefill {
  const sourceRefId = numericSourceRefId(record.id)
  return {
    source: 'manual-selection',
    sourceCollectionId: record.id,
    collectionNo: record.collectionNo,
    sourcePlatform: record.sourcePlatform,
    sourceTitleCn: record.sourceTitleCn || record.selectedText,
    sourceUrl: record.pageUrl || record.sourceUrl,
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

function uniqueTexts(values: Array<string | undefined>) {
  return values.map(text).filter((value, index, list) => value && list.indexOf(value) === index)
}

function text(value?: string) {
  return (value || '').trim()
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
