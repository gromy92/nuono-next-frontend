export type ProductKeywordStatus = 'OBSERVED' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED'

export type ProductKeywordSourceType =
  | 'MANUAL'
  | 'TITLE_HISTORY'
  | 'LISTING_DRAFT'
  | 'COMPETITOR_KEYWORD'
  | 'ADS_QUERY'

export type ProductKeywordEventStatus =
  | 'OBSERVED'
  | 'ADDED'
  | 'REMOVED'
  | 'MATCHED'
  | 'PERFORMED'
  | 'SUGGESTED'

export type ProductKeywordTitleType =
  | 'CORE'
  | 'ATTRIBUTE'
  | 'SCENE'
  | 'AUDIENCE'
  | 'SPEC'
  | 'TRENDING'

export type ProductKeywordTitleUsageState =
  | 'TITLE_TARGET'
  | 'TITLE_COVERED'
  | 'TITLE_MISSING'
  | 'TITLE_REMOVED'
  | 'TITLE_NOT_FIT'

export type ProductKeywordListRequest = {
  storeCode?: string
  siteCode?: string
  partnerSku?: string
  keywordNorm?: string
  status?: ProductKeywordStatus | string
  limit?: number
}

export type ProductKeywordProductRequest = {
  storeCode: string
  siteCode: string
}

export type ProductKeywordCommand = {
  storeCode: string
  siteCode: string
  partnerSku: string
  keyword: string
  locale?: string | null
  intentTags?: string[]
}

export type ProductKeywordUpdateCommand = ProductKeywordCommand

export type ProductCompetitorKeywordSource = {
  label?: string
  url?: string
  sourceText?: string
}

export type ProductCompetitorKeywordCommand = {
  storeCode: string
  siteCode: string
  partnerSku: string
  keywords: string[]
  competitorSources?: ProductCompetitorKeywordSource[]
}

export type ProductKeywordEditorSaveRow = {
  keywordId?: number
  keyword: string
  saveKeyword: boolean
  competitorSources?: ProductCompetitorKeywordSource[]
}

export type ProductKeywordEditorSaveCommand = {
  storeCode: string
  siteCode: string
  partnerSku: string
  rows: ProductKeywordEditorSaveRow[]
  deletedKeywordIds: number[]
}

export type ProductKeywordItem = {
  id: number
  ownerUserId: number
  storeCode: string
  siteCode: string
  partnerSku: string
  keyword: string
  keywordNorm: string
  locale?: string | null
  status: ProductKeywordStatus | string
  intentTagsJson?: string | null
  sourceSummaryJson?: string | null
  titleTypes?: Array<ProductKeywordTitleType | string>
  titleUsageStates?: Array<ProductKeywordTitleUsageState | string>
  competitorEvidence?: boolean
  adsEvidence?: boolean
  negativeCandidate?: boolean
  firstSeenAt?: string | null
  lastSeenAt?: string | null
}

export type ProductKeywordEventItem = {
  id: number
  keywordId?: number | null
  ownerUserId: number
  storeCode: string
  siteCode: string
  partnerSku: string
  keyword: string
  keywordNorm: string
  sourceType: ProductKeywordSourceType | string
  sourceRefType?: string | null
  sourceRefId?: number | null
  sourceRefKey?: string | null
  eventNaturalKey: string
  eventStatus: ProductKeywordEventStatus | string
  occurredAt: string
  factDateFrom?: string | null
  factDateTo?: string | null
  payloadJson?: string | null
  metricsJson?: string | null
}

export type ProductKeywordListView = {
  items: ProductKeywordItem[]
}

export type ProductKeywordPanelView = {
  storeCode: string
  siteCode: string
  partnerSku: string
  keywords: ProductKeywordItem[]
  events: ProductKeywordEventItem[]
}
