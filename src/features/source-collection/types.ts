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

export type Ali1688CandidatePreview = {
  id: string
  rankNo: number
  selectedRankNo?: number
  level: Ali1688CandidateLevel
  title: string
  supplierName: string
  candidateUrl?: string
  priceText?: string
  moqText?: string
  locationText?: string
  imageUrl?: string
  imageUrls?: string[]
  ruleScore?: number
  totalScore?: number
  scoreStatus?: 'pending' | 'partial' | 'final' | string
  scoreBreakdown?: Ali1688CandidateScoreBreakdown
  aiAssessmentStatus?: 'pending' | 'running' | 'success' | 'failed' | string
  detailEnrichmentStatus?: 'not_requested' | 'pending' | 'completed' | 'failed' | 'unavailable' | string
  detailTitle?: string
  detailImageUrls?: string[]
  detailUnit?: string
  detailSkuCount?: number
  detailServiceLabels?: string[]
  detailAttributes?: Array<{ name: string; values: string[]; source?: string }>
  detailSkuOptions?: Array<{ name: string; values: string[] }>
  detailPagePriceHint?: Record<string, unknown>
  detailSupplierProfile?: Record<string, unknown>
  detailShippingSnapshot?: Record<string, unknown>
  pricePreviewStatus?: 'price_probe_pending' | 'price_probe_failed' | 'price_confirmed' | string
  confirmedRealPriceText?: string
  pricePreviewFailureCode?: string
  pricePreviewFailureMessage?: string
  pricePreviewSafetyMode?: string
  candidateGateStatus?: string
  autoInquiryEligible?: boolean
  autoInquiryBlockReasons?: string[]
  reasons?: string[]
  warnings?: string[]
  procurementInquiryStatus?: string
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
  canGenerateProcurementOrder?: boolean
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
  collectedBy: string
  collectedFieldCount: number
  collectedFieldTotal?: number
  specAttributeCount?: number
  imageCount: number
  ali1688Collection?: Ali1688CollectionView
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
