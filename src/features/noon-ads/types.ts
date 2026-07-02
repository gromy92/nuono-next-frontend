export type NoonAdvertisingDashboardQuery = {
  projectCode: string
  storeCode: string
  siteCode: string
  dateFrom: string
  dateTo: string
}

export type NoonAdvertisingLatestReportWindowQuery = {
  projectCode: string
  storeCode: string
  siteCode: string
}

export type NoonAdvertisingLatestReportWindow = {
  dataAvailable: boolean
  dateFrom?: string | null
  dateTo?: string | null
}

export type NoonAdvertisingSummaryView = {
  campaignCount: number
  queryCount: number
  views: number
  clicks: number
  ordersCount: number
  assistedOrders: number
  atcCount: number
  spendAmount: number
  adRevenue: number
  ctrPercentage: number
  roas: number
  cpc: number
  cps: number
  cvrPercentage: number
  zeroOrderSpendAmount: number
  zeroOrderSpendShare: number
}

export type NoonAdvertisingSalesSummaryView = {
  netUnits: number
  revenueShipped: number
  adSpendShareOfSales: number
}

export type NoonAdvertisingDataStatus = {
  batchCount: number
  campaignRowCount: number
  queryRowCount: number
  earliestReportDate?: string | null
  latestReportDate?: string | null
  dataAvailable: boolean
}

export type NoonAdvertisingCampaignRow = {
  campaignCode: string
  campaignName?: string | null
  storeCode?: string | null
  siteCode?: string | null
  primaryAdSkuCode?: string | null
  primaryPartnerSku?: string | null
  primarySku?: string | null
  productIdentityKey?: string | null
  advertisingIdentityKey?: string | null
  productIdentityResolved?: boolean
  campaignStatus?: string | null
  qcStatus?: string | null
  views: number
  clicks: number
  ordersCount: number
  assistedOrders: number
  atcCount: number
  spendAmount: number
  adRevenue: number
  ctrPercentage: number
  roas: number
  cpc: number
  cps: number
  cvrPercentage: number
  zeroOrderSpendAmount: number
  zeroOrderSpendShare: number
}

export type NoonAdvertisingQueryRow = {
  campaignCode: string
  campaignName?: string | null
  storeCode?: string | null
  siteCode?: string | null
  adSkuCode?: string | null
  partnerSku?: string | null
  sku?: string | null
  productIdentityKey?: string | null
  advertisingIdentityKey?: string | null
  productIdentityResolved?: boolean
  queryText: string
  queryKind?: string | null
  views: number
  clicks: number
  ordersCount: number
  assistedOrders: number
  atcCount: number
  spendAmount: number
  adRevenue: number
  ctrPercentage: number
  roas: number
  cpc: number
  cps: number
  cvrPercentage: number
}

export type NoonAdvertisingProductRow = {
  storeCode?: string | null
  siteCode?: string | null
  adSkuCode?: string | null
  partnerSku?: string | null
  imageUrl?: string | null
  productIdentityKey?: string | null
  advertisingIdentityKey?: string | null
  productIdentityResolved?: boolean
  sku: string
  campaignCount: number
  queryCount: number
  views: number
  clicks: number
  ordersCount: number
  assistedOrders: number
  atcCount: number
  spendAmount: number
  adRevenue: number
  ctrPercentage: number
  roas: number
  cpc: number
  cps: number
  cvrPercentage: number
  zeroOrderSpendAmount: number
  zeroOrderSpendShare: number
}

export type NoonAdvertisingPlanType =
  | 'EXPLORATION'
  | 'CORE'
  | 'UNCLASSIFIED'

export type NoonAdvertisingPlanTypeConfidence =
  | 'RULE'
  | 'INFERRED'
  | 'UNKNOWN'

export type NoonAdvertisingStructureStatus =
  | 'HEALTHY'
  | 'NEEDS_ATTENTION'
  | 'RISK'
  | 'INSUFFICIENT_DATA'

export type NoonAdvertisingProductDiagnosisType =
  | 'STOP_LOSS'
  | 'PROMOTE_TO_CORE'
  | 'CORE_OBSERVE'
  | 'STRUCTURE_REVIEW'
  | 'INSUFFICIENT_DATA'

export type NoonAdvertisingProductDiagnostic = {
  storeCode?: string | null
  siteCode?: string | null
  adSkuCode?: string | null
  partnerSku?: string | null
  productIdentityKey?: string | null
  advertisingIdentityKey?: string | null
  productIdentityResolved?: boolean
  sku: string
  campaignCount: number
  queryCount: number
  diagnosisType: NoonAdvertisingProductDiagnosisType
  diagnosisLabel: string
  priorityScore: number
  coreCampaignCount: number
  explorationCampaignCount: number
  unclassifiedCampaignCount: number
  structureStatus: NoonAdvertisingStructureStatus
  labels: string[]
  recommendedActions: string[]
  planTypeCounts: Partial<Record<NoonAdvertisingPlanType, number>>
  rankDataAvailable: boolean
}

export type NoonAdvertisingCampaignDiagnostic = {
  campaignCode: string
  storeCode?: string | null
  siteCode?: string | null
  adSkuCode?: string | null
  partnerSku?: string | null
  productIdentityKey?: string | null
  advertisingIdentityKey?: string | null
  productIdentityResolved?: boolean
  sku?: string | null
  planType: NoonAdvertisingPlanType
  planTypeConfidence: NoonAdvertisingPlanTypeConfidence
  planTypeLabel: string
  labels: string[]
  recommendedActions: string[]
}

export type NoonAdvertisingDashboardView = {
  adSummary: NoonAdvertisingSummaryView
  salesSummary: NoonAdvertisingSalesSummaryView
  campaignRows: NoonAdvertisingCampaignRow[]
  productRows: NoonAdvertisingProductRow[]
  productDiagnostics: NoonAdvertisingProductDiagnostic[]
  campaignDiagnostics: NoonAdvertisingCampaignDiagnostic[]
  zeroOrderQueries: NoonAdvertisingQueryRow[]
  winningQueries: NoonAdvertisingQueryRow[]
  dataStatus: NoonAdvertisingDataStatus
}
