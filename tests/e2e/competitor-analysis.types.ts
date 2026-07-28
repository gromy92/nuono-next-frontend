
export const transparentPixel =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='

export type MockKeyword = {
  id: number
  watchProductId: number
  keyword: string
  keywordNorm: string
  locale: string
  status: string
  displayOrder: number
  lastProviderStatus?: string
  lastSucceededAt?: string
}

export type MockCandidate = {
  id: number
  watchProductId: number
  noonProductCode: string
  codeType: string
  canonicalUrl: string
  titleSnapshot: string
  brandSnapshot: string
  imageUrlSnapshot: string
  priceAmountSnapshot?: number
  currencyCodeSnapshot?: string
  ratingSnapshot?: number
  reviewCountSnapshot?: number
  sourceType: string
  reviewStatus: string
  lastSeenAt: string
}

export type MockRelation = {
  id: number
  keywordId: number
  competitorProductId: number
  relationStatus: string
  firstSeenRunId?: number
  lastSeenRunId?: number
  lastSeenRankNo?: number
  lastSeenSponsored?: boolean
  lastSeenAt: string
}

export type MockDetail = {
  watchProduct: {
    id: number
    ownerUserId: number
    storeCode: string
    siteCode: string
    productSiteOfferId: number
    skuParent: string
    partnerSku: string
    childSku: string
    selfNoonProductCode: string
    selfCodeType: string
    title: string
    brand: string
    imageUrl: string
    productFulltype: string
    status: string
    latestRunId?: number
    latestRunStatus?: string
    latestRunAt?: string
  }
  keywords: MockKeyword[]
  candidates: MockCandidate[]
  keywordRelations: MockRelation[]
  recent7dChangedCompetitorCount?: number
  recent7dCompetitorChangeCount?: number
  latestRankPoints: Array<{
    keywordId: number
    keyword: string
    trackedProductType: string
    noonProductCode: string
    rankStatus: string
    rankNo?: number
    scanDepth?: number
    sponsored: boolean
    priceAmount?: number
    currencyCode?: string
    factTime: string
  }>
}

