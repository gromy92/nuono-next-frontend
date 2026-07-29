import type {
  BackendCompetitorDashboard,
  BackendDashboardAttributeChangeItem,
  BackendDashboardProductItem,
  BackendDashboardRankChangeItem,
  BackendDashboardSummaryItem,
  BackendDashboardTrendItem
} from './backendContracts'
import type {
  CompetitorDashboard,
  CompetitorDashboardAttributeChangeItem,
  CompetitorDashboardProductItem,
  CompetitorDashboardRankChangeItem,
  CompetitorDashboardSummaryItem,
  CompetitorDashboardTrendItem
} from '../types'
import {
  dashboardChangeLabel,
  dashboardIssueLabel,
  formatFactDate,
  normalizeDashboardChangeType,
  normalizeDashboardDays,
  normalizeDashboardIssueType,
  normalizeRankStatus,
  numberValue,
  optionalId,
  optionalImageUrlValue,
  stringValue
} from './transportValues'

export function mapDashboard(payload: BackendCompetitorDashboard): CompetitorDashboard {
  return {
    storeCode: stringValue(payload.storeCode),
    siteCode: stringValue(payload.siteCode),
    days: normalizeDashboardDays(payload.days),
    competitorAttributeChangeDate: formatFactDate(payload.competitorAttributeChangeDate) || undefined,
    competitorAttributeSnapshotCount: numberValue(payload.competitorAttributeSnapshotCount),
    issueSummary: (payload.issueSummary || []).map(mapDashboardSummaryItem),
    issueTrend: (payload.issueTrend || []).map(mapDashboardTrendItem),
    coverageTopProducts: (payload.coverageTopProducts || []).map(mapDashboardProductItem),
    rankIssueTopProducts: (payload.rankIssueTopProducts || []).map(mapDashboardProductItem),
    changeTypeDistribution: (payload.changeTypeDistribution || []).map(mapDashboardSummaryItem),
    changedProductTop: (payload.changedProductTop || []).map(mapDashboardProductItem),
    selfRankChanges: (payload.selfRankChanges || []).map(mapDashboardRankChangeItem),
    competitorRankChanges: (payload.competitorRankChanges || []).map(mapDashboardRankChangeItem),
    competitorAttributeChanges: (payload.competitorAttributeChanges || []).map(mapDashboardAttributeChangeItem)
  }
}

function mapDashboardSummaryItem(row: BackendDashboardSummaryItem): CompetitorDashboardSummaryItem {
  return {
    ...mapDashboardDrill(row),
    label: stringValue(row.label) || dashboardIssueLabel(row.issueType),
    value: numberValue(row.value)
  }
}

function mapDashboardTrendItem(row: BackendDashboardTrendItem): CompetitorDashboardTrendItem {
  return {
    ...mapDashboardDrill(row),
    date: formatFactDate(row.date),
    label: stringValue(row.label) || dashboardIssueLabel(row.issueType),
    value: numberValue(row.value)
  }
}

function mapDashboardProductItem(row: BackendDashboardProductItem): CompetitorDashboardProductItem {
  const partnerSku = stringValue(row.partnerSku)
  const title = stringValue(row.title)
  return {
    ...mapDashboardDrill(row),
    label: partnerSku || title || optionalId(row.watchProductId) || '未命名商品',
    partnerSku,
    title,
    value: numberValue(row.value),
    targetValue: row.targetValue === undefined || row.targetValue === null ? undefined : numberValue(row.targetValue)
  }
}

function mapDashboardRankChangeItem(row: BackendDashboardRankChangeItem): CompetitorDashboardRankChangeItem {
  return {
    watchProductId: optionalId(row.watchProductId),
    productSiteOfferId: optionalId(row.productSiteOfferId),
    partnerSku: stringValue(row.partnerSku),
    title: stringValue(row.title),
    imageUrl: optionalImageUrlValue(row.imageUrl),
    keywordId: optionalId(row.keywordId),
    keyword: stringValue(row.keyword),
    trackedProductType: String(row.trackedProductType || '').toUpperCase() === 'COMPETITOR' ? 'competitor' : 'self',
    noonProductCode: stringValue(row.noonProductCode),
    previousRankStatus: normalizeRankStatus(row.previousRankStatus),
    previousRankNo: row.previousRankNo,
    previousDate: formatFactDate(row.previousDate) || undefined,
    rankStatus: normalizeRankStatus(row.rankStatus),
    rankNo: row.rankNo,
    currentDate: formatFactDate(row.currentDate) || undefined,
    rankDelta: numberValue(row.rankDelta),
    priceChangeSummary: stringValue(row.priceChangeSummary) || undefined,
    titleChangeSummary: stringValue(row.titleChangeSummary) || undefined,
    adChangeSummary: stringValue(row.adChangeSummary) || undefined
  }
}

function mapDashboardAttributeChangeItem(row: BackendDashboardAttributeChangeItem): CompetitorDashboardAttributeChangeItem {
  return {
    watchProductId: optionalId(row.watchProductId),
    productSiteOfferId: optionalId(row.productSiteOfferId),
    partnerSku: stringValue(row.partnerSku),
    title: stringValue(row.title),
    productImageUrl: optionalImageUrlValue(row.productImageUrl),
    selfPreviousValue: stringValue(row.selfPreviousValue) || undefined,
    selfCurrentValue: stringValue(row.selfCurrentValue) || undefined,
    selfCurrentDate: formatFactDate(row.selfCurrentDate) || undefined,
    selfSnapshotCount: numberValue(row.selfSnapshotCount),
    selfLatestValue: stringValue(row.selfLatestValue) || undefined,
    selfLatestDate: formatFactDate(row.selfLatestDate) || undefined,
    noonProductCode: stringValue(row.noonProductCode),
    competitorTitle: stringValue(row.competitorTitle),
    competitorImageUrl: optionalImageUrlValue(row.competitorImageUrl),
    changeType: normalizeDashboardChangeType(row.changeType) || 'PRICE',
    label: stringValue(row.label) || dashboardChangeLabel(row.changeType),
    previousValue: stringValue(row.previousValue),
    currentValue: stringValue(row.currentValue),
    currentDate: formatFactDate(row.currentDate) || undefined,
    latestRankKeyword: stringValue(row.latestRankKeyword) || undefined,
    changeDateRankNo: numberValue(row.changeDateRankNo),
    latestRankNo: row.latestRankNo,
    selfLatestRankKeyword: stringValue(row.selfLatestRankKeyword) || undefined,
    selfLatestRankStatus: normalizeRankStatus(row.selfLatestRankStatus),
    selfLatestRankNo: row.selfLatestRankNo,
    selfLatestScanDepth: numberValue(row.selfLatestScanDepth)
  }
}

function mapDashboardDrill(row: BackendDashboardSummaryItem) {
  return {
    issueType: normalizeDashboardIssueType(row.issueType),
    productSiteOfferId: optionalId(row.productSiteOfferId),
    partnerSku: stringValue(row.partnerSku),
    watchProductId: optionalId(row.watchProductId),
    competitorOfferId: optionalId(row.competitorOfferId),
    date: formatFactDate(row.date) || undefined,
    changeType: normalizeDashboardChangeType(row.changeType)
  }
}
