import type { ProductCompetitorContentMaterial } from '../product-management/types/competitorContent'

export type ProductListingValidationIssue = {
  fieldKey: string
  severity: string
  code: string
  message: string
}

export type ProductListingDraftPayload = {
  draftId?: number
  storeCode: string
  sourceType?: string
  sourceRefId?: number
  psku: string
  idProductFullType?: number
  productFullType?: string
  family?: string
  productType?: string
  productSubType?: string
  productBrand?: string
  productBrandCode?: string
  productTitleCn?: string
  productTitleEn?: string
  productTitleAr?: string
  productDescriptionCn?: string
  productDescriptionEn?: string
  productDescriptionAr?: string
  productHighlightsCn?: string[]
  productHighlightsEn?: string[]
  productHighlightsAr?: string[]
  keyAttributes?: Array<Record<string, unknown>>
  imageUrls: string[]
  price?: number
  priceMin?: number
  priceMax?: number
  salePrice?: number
  saleStart?: string
  saleEnd?: string
  purchasePrice?: number
  supplyEvidenceType?: string
  supplyEvidenceRefId?: number
  optionalPurchaseOrderId?: number
  fbp?: boolean
  warehouseId?: string
  warehouseCode?: string
  quantity?: number
  idWarranty?: number
  isActive?: boolean
  offerNote?: string
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

export type ProductListingNoonWriteStepResult = {
  stepKey?: string
  status?: string
  externalReference?: string
  failureCode?: string
  failureMessage?: string
}

export type ProductListingNoonWriteResult = {
  success?: boolean
  failureCategory?: string
  failureCode?: string
  failureMessage?: string
  steps?: ProductListingNoonWriteStepResult[]
}

export type ProductListingTaskView = {
  taskId: number
  taskNo?: string
  draftId: number
  ownerUserId?: number
  storeCode: string
  partnerSku?: string
  mode: string
  status: string
  sourceTaskId?: number
  validationIssues: ProductListingValidationIssue[]
  failureCategory?: string
  failureCode?: string
  failureMessage?: string
  noonResult?: ProductListingNoonWriteResult
  submittedAt?: string
  startedAt?: string
  completedAt?: string
}

export type ProductListingRealRunCommand = {
  confirmRealNoonWrite: boolean
  confirmationNote?: string
}

export type ProductListingAiListingDraft = {
  productTitleEn?: string
  productTitleAr?: string
  productHighlightsEn?: string[]
  productHighlightsAr?: string[]
  productDescriptionEn?: string
  productDescriptionAr?: string
}

export type ProductListingAiListingSection = {
  title?: string
  bullets?: string[]
  longDescription?: string
}

export type ProductListingAiListingData = {
  inputCompleteness?: {
    summary?: string
    missingCritical?: string[]
    missingOptional?: string[]
  }
  productUnderstanding?: {
    productType?: string
    buyerUseCases?: string[]
    confirmedFacts?: string[]
  }
  styleDecision?: {
    style?: string
    rationale?: string
  }
  keywords?: {
    english?: string[]
    arabic?: string[]
  }
  attributeGuardrails?: {
    confirmedAttributes?: string[]
    usableSellingPoints?: string[]
    forbiddenClaims?: string[]
  }
  listingStrategy?: {
    english?: string
    arabic?: string
  }
  englishListing?: ProductListingAiListingSection
  arabicListing?: ProductListingAiListingSection
  qualityCheck?: {
    score?: number
    findings?: string[]
    uploadNotes?: string[]
    removeMarkdownBeforeUpload?: boolean
  }
  warnings?: string[]
  needsHumanConfirmation?: string[]
  noonUploadDraft?: ProductListingAiListingDraft
}

export type ProductListingAiListingCommand = {
  draft: ProductListingDraftPayload
  operatorRequirement?: string
  competitorMaterials?: ProductCompetitorContentMaterial[]
}

export type ProductListingAiListingView = {
  ready?: boolean
  source?: string
  ruleVersion?: string
  msg?: string
  message?: string
  warnings?: string[]
  data?: ProductListingAiListingData
}
