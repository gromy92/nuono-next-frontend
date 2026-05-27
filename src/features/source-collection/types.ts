export type SourceCollectionStatus = 'success' | 'running' | 'failed'

export type Ali1688CollectionStatus =
  | 'not_started'
  | 'queued'
  | 'running'
  | 'success'
  | 'partial_success'
  | 'failed'

export type Ali1688CandidateLevel = 'recommended' | 'review' | 'reject'

export type Ali1688CandidateScoreBreakdown = {
  matchScore?: number
  specScore?: number
  priceScore?: number
  moqScore?: number
  supplierScore?: number
  deliveryScore?: number
}

export type Ali1688CandidatePriceState =
  | 'list_hint_only'
  | 'price_probe_pending'
  | 'price_probe_failed'
  | 'price_confirmed'
  | string

export type Ali1688CandidateGateState =
  | 'ai_pending'
  | 'ai_failed'
  | 'mismatch_rejected'
  | 'spec_uncertain'
  | 'price_probe_pending'
  | 'price_probe_failed'
  | 'price_confirmed'
  | 'inquiry_eligible'
  | string

export type Ali1688CandidateGateView = {
  state?: Ali1688CandidateGateState
  label?: string
  reason?: string
  allowsPriceProbe?: boolean
  allowsAutoInquiry?: boolean
}

export type Ali1688InquiryEligibilityState =
  | 'eligible'
  | 'rejected_missing_ai'
  | 'rejected_ai_failed'
  | 'rejected_high_risk'
  | 'rejected_spec_uncertain'
  | 'rejected_missing_real_price'
  | 'rejected_price_failed'
  | string

export type Ali1688InquiryEligibilityView = {
  state?: Ali1688InquiryEligibilityState
  label?: string
  reason?: string
  eligible?: boolean
  priceFailureCode?: string
}

export type Ali1688FieldCompleteness = {
  candidateCount?: number
  nonFallbackTitleCount?: number
  supplierNameCount?: number
  priceTextCount?: number
  moqTextCount?: number
  locationTextCount?: number
  normalizedDetailUrlCount?: number
}

export type Ali1688GatewayStatus = {
  gatewayServiceKind?: string
  sessionState?: 'ready' | 'login_required' | 'captcha_required' | 'rate_limited' | string
  runtimeReady?: boolean
  captchaAutoSolveEnabled?: boolean
  userFacingStatus?: 'available' | 'login_required' | 'blocked_by_captcha' | 'cooling_down' | 'unavailable' | string
  userFacingMessage?: string
}

export type Ali1688PluginAssignmentStatus =
  | 'created'
  | 'running'
  | 'accepted'
  | 'failed'
  | 'cancelled'
  | 'expired'
  | string

export type Ali1688PluginAssignmentView = {
  assignmentId?: string
  assignmentCode?: string
  taskId?: string
  sourceCollectionId?: string
  taskNo?: string
  status?: Ali1688PluginAssignmentStatus
  sourceImageUrl?: string
  sourceTitle?: string
  sourceTitleCn?: string
  sourceUrl?: string
  pageUrl?: string
  storeId?: string
  storeName?: string
  storeCode?: string
  createdAt?: string
  expiresAt?: string
  startedAt?: string
  finishedAt?: string
  failureCode?: string
  failureMessage?: string
  submittedCandidateCount?: number
  acceptedCandidateCount?: number
  rejectedCandidateCount?: number
  current?: boolean
  message?: string
}

export type Ali1688CandidatePreview = {
  id: string
  rankNo: number
  selectedRankNo?: number
  level: Ali1688CandidateLevel
  title: string
  supplierName: string
  candidateUrl?: string
  priceText?: string
  listPriceHintText?: string
  priceState?: Ali1688CandidatePriceState
  confirmedPriceText?: string | null
  moqText?: string
  locationText?: string
  imageUrl?: string
  imageUrls?: string[]
  ruleScore?: number
  totalScore?: number
  scoreStatus?: 'pending' | 'partial' | 'final' | string
  scoreBreakdown?: Ali1688CandidateScoreBreakdown
  aiAssessmentStatus?: 'pending' | 'running' | 'success' | 'failed' | string
  reasons?: string[]
  warnings?: string[]
  procurementInquiryStatus?: string
  autoInquiryEligible?: boolean
  inquiryEligibility?: Ali1688InquiryEligibilityView
  gate?: Ali1688CandidateGateView
}

export type Ali1688CollectionView = {
  id?: string
  taskId?: string
  sourceCollectionId?: string
  sourceCollectionNo?: string
  storeId?: string
  storeName?: string
  storeCode?: string
  sourcePlatform?: string
  sourceTitle?: string
  sourceTitleCn?: string
  sourceUrl?: string
  pageUrl?: string
  status: Ali1688CollectionStatus
  progressPercent?: number
  searchMode?: string
  sourceImageUrl?: string
  selectedImageCount?: number
  scannedCount?: number
  candidateCount?: number
  recommendedCount?: number
  failureCode?: string
  failureMessage?: string
  startedAt?: string
  finishedAt?: string
  message?: string
  detailCompletionStatus?: 'not_attempted' | 'completed' | 'partial_enriched' | 'blocked_by_captcha' | 'failed' | 'unknown' | string
  detailCompletionMessage?: string
  fieldCompleteness?: Ali1688FieldCompleteness
  gatewayStatus?: Ali1688GatewayStatus
  pluginAssistAvailable?: boolean
  pluginAssignment?: Ali1688PluginAssignmentView
  canGenerateProcurementOrder?: boolean
  inquiryEligibleCount?: number
  inquiryBlockedCount?: number
  candidates?: Ali1688CandidatePreview[]
}

export type ProductSelectionSourceCollection = {
  id: string
  collectionNo: string
  storeId?: string
  storeName?: string
  storeCode?: string
  sourceType: string
  sourcePlatform: string
  sourceUrl?: string
  pageUrl?: string
  sourceTitle: string
  sourceTitleCn?: string
  sourceTitleAr?: string
  sourceImageUrl: string
  imageUrls: string[]
  priceSummary?: string
  moqHint?: string
  shippingFrom?: string
  brandName?: string
  unitCount?: string
  colorName?: string
  specHints: string[]
  sourceDescriptionEn?: string
  sourceDescriptionAr?: string
  sourceSellingPointsEn?: string[]
  sourceSellingPointsAr?: string[]
  selectedText?: string
  selectedTextAr?: string
  notes?: string
  status: SourceCollectionStatus
  statusText: string
  failureCode?: string
  failureMessage?: string
  collectedAt: string
  collectionStartedAt?: string
  collectionFinishedAt?: string
  collectionDurationSeconds?: number
  collectedBy: string
  collectedFieldCount: number
  collectedFieldTotal?: number
  specAttributeCount?: number
  imageCount: number
  ali1688Collection?: Ali1688CollectionView
}

export type ProductSelectionSourceCollectionPage = {
  items: ProductSelectionSourceCollection[]
  total: number
  page: number
  pageSize: number
}

export type SourceCollectionListQuery = {
  page?: number
  pageSize?: number
  sourcePlatform?: string
  sourceTitle?: string
  sourceTitleCn?: string
  status?: SourceCollectionStatus
}

export type SourceCollectionFormValue = {
  sourceType: 'marketplace-url' | 'image-search-source'
  sourcePlatform: string
  sourceUrl?: string
  pageUrl?: string
  sourceTitle?: string
  sourceTitleCn?: string
  sourceTitleAr?: string
  sourceImageUrl?: string
  imageUrlsText?: string
  priceSummary?: string
  moqHint?: string
  shippingFrom?: string
  specHintsText?: string
  sourceDescriptionEn?: string
  sourceDescriptionAr?: string
  sourceSellingPointsEn?: string[]
  sourceSellingPointsAr?: string[]
  selectedText?: string
  selectedTextAr?: string
  notes?: string
}
