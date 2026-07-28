import { normalizeNoonImageAssetMetadata } from '../product-image-profile/noonListingImageRequirements'
import type { ProductListingDraftPayload } from './types'
import type { ProductListingEditorDraft, ProductListingMetadataFormValues } from './productDetailAdapterTypes'
import {
  normalizeKeywordSuggestions,
  normalizeProductListingCompetitorMaterials,
  normalizeProductListingImageRoleAssignments,
  normalizeProductListingKeyAttributes,
  normalizeStringList,
  optionalInteger,
  optionalNumber,
  optionalText,
  shouldApplyPrefillValue,
  text
} from './productDetailAdapterNormalization'

export function createProductListingEditorDraft(storeCode?: string): ProductListingEditorDraft {
  return normalizeProductListingEditorDraft({
    storeCode: storeCode || '',
    psku: '',
    imageUrls: [],
    imageRoleAssignments: [],
    imageAssetMetadata: [],
    keyAttributes: normalizeProductListingKeyAttributes([]),
    isActive: true,
    supplyEvidenceType: undefined
  })
}

export function normalizeProductListingEditorDraft(
  draft: Partial<ProductListingEditorDraft>,
  fallbackStoreCode?: string
): ProductListingEditorDraft {
  const normalized = {
    ...draft,
    storeCode: text(draft.storeCode) || text(fallbackStoreCode),
    psku: text(draft.psku),
    imageUrls: normalizeStringList(draft.imageUrls),
    imageRoleAssignments: normalizeProductListingImageRoleAssignments(draft.imageUrls, draft.imageRoleAssignments),
    imageAssetMetadata: normalizeNoonImageAssetMetadata(draft.imageUrls, draft.imageAssetMetadata),
    keyAttributes: normalizeProductListingKeyAttributes(draft.keyAttributes, draft.barcode),
    listingKeywordSuggestionsEn: normalizeKeywordSuggestions(draft.listingKeywordSuggestionsEn),
    listingKeywordSuggestionsAr: normalizeKeywordSuggestions(draft.listingKeywordSuggestionsAr),
    isActive: true
  } as ProductListingEditorDraft & Record<string, unknown>
  delete normalized.fbp
  delete normalized.warehouseId
  delete normalized.warehouseCode
  delete normalized.quantity
  return normalized
}

export function mergeProductListingPrefillDraft(
  currentDraft: ProductListingEditorDraft,
  prefillDraft: Partial<ProductListingEditorDraft>
): Partial<ProductListingEditorDraft> {
  const merged: Record<string, unknown> = { ...currentDraft }
  Object.entries(prefillDraft).forEach(([key, value]) => {
    if (shouldApplyPrefillValue(value, merged[key])) {
      merged[key] = value
    }
  })
  return merged as Partial<ProductListingEditorDraft>
}

export function productListingEditorDraftToMetadataValues(
  draft: ProductListingEditorDraft
): ProductListingMetadataFormValues {
  return {
    storeCode: draft.storeCode,
    sourceType: draft.sourceType,
    sourceRefId: draft.sourceRefId,
    psku: draft.psku
  }
}

export function productListingEditorDraftToPayload(
  draft: ProductListingEditorDraft,
  currentDraftId?: number
): ProductListingDraftPayload {
  return {
    draftId: draft.draftId ?? currentDraftId,
    storeCode: text(draft.storeCode),
    sourceType: optionalText(draft.sourceType),
    sourceRefId: optionalInteger(draft.sourceRefId),
    psku: text(draft.psku),
    idProductFullType: optionalInteger(draft.idProductFullType),
    productFullType: optionalText(draft.productFullType),
    family: optionalText(draft.family),
    productType: optionalText(draft.productType),
    productSubType: optionalText(draft.productSubType),
    productBrand: optionalText(draft.productBrand),
    productBrandCode: optionalText(draft.productBrandCode),
    productTitleCn: optionalText(draft.productTitleCn),
    productTitleEn: optionalText(draft.productTitleEn),
    productTitleAr: optionalText(draft.productTitleAr),
    productDescriptionCn: optionalText(draft.productDescriptionCn),
    productDescriptionEn: optionalText(draft.productDescriptionEn),
    productDescriptionAr: optionalText(draft.productDescriptionAr),
    productHighlightsCn: normalizeStringList(draft.productHighlightsCn),
    productHighlightsEn: normalizeStringList(draft.productHighlightsEn),
    productHighlightsAr: normalizeStringList(draft.productHighlightsAr),
    sizeEn: optionalText(draft.sizeEn),
    sizeAr: optionalText(draft.sizeAr),
    keyAttributes: normalizeProductListingKeyAttributes(draft.keyAttributes, draft.barcode),
    imageUrls: normalizeStringList(draft.imageUrls),
    imageRoleAssignments: normalizeProductListingImageRoleAssignments(draft.imageUrls, draft.imageRoleAssignments),
    imageAssetMetadata: normalizeNoonImageAssetMetadata(draft.imageUrls, draft.imageAssetMetadata),
    price: optionalNumber(draft.price),
    priceMin: optionalNumber(draft.priceMin),
    priceMax: optionalNumber(draft.priceMax),
    salePrice: optionalNumber(draft.salePrice),
    saleStart: optionalText(draft.saleStart),
    saleEnd: optionalText(draft.saleEnd),
    purchasePrice: optionalNumber(draft.purchasePrice),
    supplyEvidenceType: optionalText(draft.supplyEvidenceType),
    supplyEvidenceRefId: optionalInteger(draft.supplyEvidenceRefId),
    optionalPurchaseOrderId: optionalInteger(draft.optionalPurchaseOrderId),
    idWarranty: optionalInteger(draft.idWarranty),
    isActive: true,
    offerNote: optionalText(draft.offerNote),
    barcode: optionalText(draft.barcode),
    competitorMaterials: normalizeProductListingCompetitorMaterials(draft.competitorMaterials),
    listingKeywordSuggestionsEn: normalizeKeywordSuggestions(draft.listingKeywordSuggestionsEn),
    listingKeywordSuggestionsAr: normalizeKeywordSuggestions(draft.listingKeywordSuggestionsAr)
  }
}

