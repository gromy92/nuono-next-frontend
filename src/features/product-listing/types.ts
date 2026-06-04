export type ProductListingValidationIssue = {
  fieldKey: string
  severity: string
  code: string
  message: string
}

export type ProductListingDraftPayload = {
  draftId?: number
  storeCode: string
  psku: string
  idProductFullType?: number
  productFullType?: string
  family?: string
  productType?: string
  productSubType?: string
  productBrand?: string
  productBrandCode?: string
  productTitleEn?: string
  productTitleAr?: string
  imageUrls: string[]
  price?: number
  purchasePrice?: number
  supplyEvidenceType?: string
  supplyEvidenceRefId?: number
  optionalPurchaseOrderId?: number
  fbp?: boolean
  warehouseId?: string
  quantity?: number
  idWarranty?: number
  barcode?: string
}

export type ProductListingDraftView = {
  draftId: number
  draftNo?: string
  ownerUserId?: number
  storeCode: string
  status: string
  draft?: ProductListingDraftPayload
  validationIssues: ProductListingValidationIssue[]
}

export type ProductListingTaskView = {
  taskId: number
  taskNo?: string
  draftId: number
  ownerUserId?: number
  storeCode: string
  mode: string
  status: string
  sourceTaskId?: number
  validationIssues: ProductListingValidationIssue[]
  failureCategory?: string
  failureCode?: string
  failureMessage?: string
  submittedAt?: string
  startedAt?: string
  completedAt?: string
}

export type ProductListingRealRunCommand = {
  confirmRealNoonWrite: boolean
  confirmationNote?: string
}
