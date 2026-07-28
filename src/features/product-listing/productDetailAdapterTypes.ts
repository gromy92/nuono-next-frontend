import type { ProductListingDraftPayload } from './types'

export type NumericDraftValue = number | string | null | undefined

export type ProductListingEditorDraft = Omit<
  ProductListingDraftPayload,
  | 'idProductFullType'
  | 'price'
  | 'priceMin'
  | 'priceMax'
  | 'salePrice'
  | 'purchasePrice'
  | 'supplyEvidenceRefId'
  | 'optionalPurchaseOrderId'
  | 'idWarranty'
> & {
  idProductFullType?: NumericDraftValue
  price?: NumericDraftValue
  purchasePrice?: NumericDraftValue
  supplyEvidenceRefId?: NumericDraftValue
  optionalPurchaseOrderId?: NumericDraftValue
  idWarranty?: NumericDraftValue
  productTitleCn?: string
  productDescriptionCn?: string
  productDescriptionEn?: string
  productDescriptionAr?: string
  productHighlightsCn?: string[]
  productHighlightsEn?: string[]
  productHighlightsAr?: string[]
  sizeEn?: string
  sizeAr?: string
  priceMin?: NumericDraftValue
  priceMax?: NumericDraftValue
  salePrice?: NumericDraftValue
  saleStart?: string
  saleEnd?: string
  isActive?: boolean
  offerNote?: string
}

export type ProductListingMetadataFormValues = Pick<
  ProductListingEditorDraft,
  | 'storeCode'
  | 'sourceType'
  | 'sourceRefId'
  | 'psku'
>

