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

export type Ali1688SpecValue = {
  name: string
  value: string
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
  matchedSpecs?: Ali1688SpecValue[]
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
  siteCode?: string
  sourcePlatform?: string
  collectionSource?: 'browser' | 'plugin' | string
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
  sourceSpecs?: Ali1688SpecValue[]
  candidates?: Ali1688CandidatePreview[]
}

export type ProductSelectionSourceCollection = {
  id: string
  collectionNo: string
  storeId?: string
  storeName?: string
  storeCode?: string
  siteCode?: string
  sourceType: string
  collectionSource?: 'browser' | 'plugin' | string
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
  collectionSource?: 'browser' | 'plugin' | string
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
