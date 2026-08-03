import type { ProductCompetitorContentMaterial } from '../product-domain/productCompetitorContent'
import type { NoonImageAssetMetadata } from '../product-image-profile/noonListingImageRequirements'
import type { ProductImageRoleAssignment } from '../product-image-profile/productImageRole'

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
  sizeEn?: string
  sizeAr?: string
  keyAttributes?: Array<Record<string, unknown>>
  imageUrls: string[]
  imageRoleAssignments?: ProductImageRoleAssignment[]
  imageAssetMetadata?: NoonImageAssetMetadata[]
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
  idWarranty?: number
  isActive?: boolean
  offerNote?: string
  barcode?: string
  competitorMaterials?: ProductCompetitorContentMaterial[]
  listingKeywordSuggestionsEn?: string[]
  listingKeywordSuggestionsAr?: string[]
}

export type ProductListingDraftView = {
  draftId: number
  draftNo?: string
  ownerUserId?: number
  storeCode: string
  status: string
  draft?: ProductListingDraftPayload
  validationIssues: ProductListingValidationIssue[]
  workflow?: ProductListingWorkflowSummaryView
}

export type ProductListingFieldValidationView = {
  issues: ProductListingValidationIssue[]
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
  skuParent?: string
  pskuCode?: string
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

export type ProductListingWorkflowPhase =
  | 'EDITING'
  | 'READY_TO_CONFIRM'
  | 'PUBLISHING'
  | 'PUBLISHED'
  | 'ACTION_REQUIRED'

export type ProductListingWriteCertainty =
  | 'NOT_STARTED'
  | 'UNKNOWN'
  | 'WRITTEN'
  | 'VERIFIED'

export type ProductListingWorkflowNextAction =
  | 'REVIEW_DRAFT'
  | 'EDIT_DRAFT'
  | 'CONFIRM_PUBLISH'
  | 'WAIT'
  | 'WAIT_FOR_AUTHORIZATION'
  | 'CHECK_CREATE_RESULT'
  | 'CONTINUE_AFTER_CREATE'
  | 'VERIFY_READBACK'
  | 'REPLAY_PROJECTION'
  | 'NONE'

export type ProductListingWorkflowView = {
  phase: ProductListingWorkflowPhase
  writeCertainty: ProductListingWriteCertainty
  nextAction: ProductListingWorkflowNextAction
  reasonCode?: string
  message?: string
  draft?: ProductListingDraftView
  dryRunTask?: ProductListingTaskView
  realRunTask?: ProductListingTaskView
}

export type ProductListingWorkflowSummaryView = Pick<
  ProductListingWorkflowView,
  'phase' | 'writeCertainty' | 'nextAction' | 'reasonCode' | 'message'
>

export type ProductListingCreateOutcomeVerificationStatus =
  | 'found'
  | 'not_found'
  | 'authorization_waiting'
  | 'lookup_failed'

export type ProductListingCreateOutcomeVerificationView = {
  taskId: number
  status: ProductListingCreateOutcomeVerificationStatus
  canConfirmNotCreated?: boolean
  lookupAttemptCount?: number
  message?: string
  partnerSku?: string
  skuParent?: string
  pskuCode?: string
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

export type ProductListingKeywordSuggestionItem = {
  keyword: string
  keywordNorm: string
  locale: string
}

export type ProductListingKeywordSuggestionView = {
  draftId?: number
  items: ProductListingKeywordSuggestionItem[]
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
