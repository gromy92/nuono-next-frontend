import type { StoreDataReportRow } from './types'

export type RankingDimension = 'salesMissing' | 'lifecycleMissing' | 'detailFieldMissing' | 'mappingAnomaly'

export const rankingDimensionOptions: Array<{ label: string; value: RankingDimension }> = [
  { label: '销量缺失', value: 'salesMissing' },
  { label: '生命周期缺失', value: 'lifecycleMissing' },
  { label: '详情字段缺失', value: 'detailFieldMissing' },
  { label: '映射异常', value: 'mappingAnomaly' }
]

export const rankingLimitOptions = [
  { label: 'Top 10', value: 10 },
  { label: 'Top 20', value: 20 }
]

export type StoreReportRowView = StoreDataReportRow & {
  rowKey: string
  displayName: string
  displayCode: string
  detailFieldMissingTotal: number
  detailFieldTotal: number
  detailMissingRate: number
  salesCoverageRate: number
  lifecycleCoverageRate: number
  mappingAnomalyTotal: number
}

export type EmptyStoreBucket = {
  key: string
  title: string
  description: string
  rows: StoreReportRowView[]
}

export type StoreDataReportProjection = {
  rows: StoreReportRowView[]
  totals: {
    storeSites: number
    siteOffers: number
    missingDetailBaseline: number
    detailFieldMissing: number
    offersWithSalesFacts: number
    offersWithoutSalesFacts: number
    salesFactRows: number
    salesMappingAnomalies: number
    crossStoreOffers: number
    lifecycleCurrent: number
    lifecycleMissing: number
    lifecycleDataInsufficient: number
    emptyStoreSites: number
    productWithoutSalesSites: number
    salesWithoutProductSites: number
  }
  detailCompletenessRows: StoreReportRowView[]
  salesCoverageRows: StoreReportRowView[]
  mappingAnomalyRows: StoreReportRowView[]
  lifecycleCoverageRows: StoreReportRowView[]
  emptyStoreBuckets: EmptyStoreBucket[]
}

export function buildStoreDataReportProjection(rows: StoreDataReportRow[]): StoreDataReportProjection {
  const rowViews = rows.map(toRowView)
  const totals = {
    storeSites: rowViews.length,
    siteOffers: sum(rowViews, (row) => row.siteOfferCount),
    missingDetailBaseline: sum(rowViews, (row) => row.missingDetailBaselineCount),
    detailFieldMissing: sum(rowViews, (row) => row.detailFieldMissingTotal),
    offersWithSalesFacts: sum(rowViews, (row) => row.offersWithSalesFacts),
    offersWithoutSalesFacts: sum(rowViews, (row) => row.offersWithoutSalesFacts),
    salesFactRows: sum(rowViews, (row) => row.salesFactRows),
    salesMappingAnomalies: sum(rowViews, (row) => row.salesKeysWithoutOfferCount),
    crossStoreOffers: sum(rowViews, (row) => row.crossStoreOfferCount),
    lifecycleCurrent: sum(rowViews, (row) => row.lifecycleCurrentCount),
    lifecycleMissing: sum(rowViews, (row) => row.lifecycleMissingCount),
    lifecycleDataInsufficient: sum(rowViews, (row) => row.lifecycleDataInsufficientCount),
    emptyStoreSites: rowViews.filter((row) => row.siteOfferCount === 0).length,
    productWithoutSalesSites: rowViews.filter((row) => row.siteOfferCount > 0 && row.offersWithSalesFacts === 0).length,
    salesWithoutProductSites: rowViews.filter((row) => row.siteOfferCount === 0 && row.salesProductKeyCount > 0).length
  }

  return {
    rows: rowViews,
    totals,
    detailCompletenessRows: sortByIssue(rowViews, (row) => row.detailFieldMissingTotal + row.missingDetailBaselineCount),
    salesCoverageRows: sortByIssue(rowViews, (row) => row.offersWithoutSalesFacts),
    mappingAnomalyRows: sortByIssue(
      rowViews.filter(
        (row) => row.salesKeysWithoutOfferCount > 0 || row.crossStoreOfferCount > 0 || row.offersWithoutSalesFacts > 0
      ),
      (row) => row.mappingAnomalyTotal + row.offersWithoutSalesFacts
    ),
    lifecycleCoverageRows: sortByIssue(rowViews, (row) => row.lifecycleMissingCount + row.lifecycleDataInsufficientCount),
    emptyStoreBuckets: buildEmptyStoreBuckets(rowViews)
  }
}

export function rankStoreRows(
  rows: StoreReportRowView[],
  dimension: RankingDimension,
  limit: number
): Array<StoreReportRowView & { rankingValue: number }> {
  return rows
    .map((row) => ({ ...row, rankingValue: rankingValue(row, dimension) }))
    .sort((first, second) => second.rankingValue - first.rankingValue || second.siteOfferCount - first.siteOfferCount)
    .slice(0, limit)
}

export function rankingValue(row: StoreReportRowView, dimension: RankingDimension) {
  if (dimension === 'lifecycleMissing') return row.lifecycleMissingCount
  if (dimension === 'detailFieldMissing') return row.detailFieldMissingTotal
  if (dimension === 'mappingAnomaly') return row.salesKeysWithoutOfferCount
  return row.offersWithoutSalesFacts
}

export function rankingDimensionLabel(dimension: RankingDimension) {
  return rankingDimensionOptions.find((option) => option.value === dimension)?.label || '销量缺失'
}

export function rankingColor(dimension: RankingDimension) {
  if (dimension === 'lifecycleMissing') return '#ef4444'
  if (dimension === 'detailFieldMissing') return '#16a34a'
  if (dimension === 'mappingAnomaly') return '#7c3aed'
  return '#f97316'
}

export function percent(current: number, total: number) {
  if (total <= 0) return 0
  return Math.round((current / total) * 100)
}

function toRowView(row: StoreDataReportRow): StoreReportRowView {
  const detailFieldMissingTotal = rowDetailFieldMissing(row)
  const detailFieldTotal = row.siteOfferCount * 5
  const displayName = row.projectName || row.projectCode || row.storeCode
  return {
    ...row,
    rowKey: `${row.storeCode}-${row.siteCode}`,
    displayName,
    displayCode: `${row.siteCode || '-'} / ${row.storeCode}`,
    detailFieldMissingTotal,
    detailFieldTotal,
    detailMissingRate: percent(detailFieldMissingTotal, detailFieldTotal),
    salesCoverageRate: percent(row.offersWithSalesFacts, row.siteOfferCount),
    lifecycleCoverageRate: percent(row.lifecycleCurrentCount, row.siteOfferCount),
    mappingAnomalyTotal: row.salesKeysWithoutOfferCount + row.crossStoreOfferCount
  }
}

function buildEmptyStoreBuckets(rows: StoreReportRowView[]): EmptyStoreBucket[] {
  return [
    {
      key: 'zero-product',
      title: '商品为 0',
      description: '店铺站点没有商品经营面，需要确认商品同步或初始化状态。',
      rows: rows.filter((row) => row.siteOfferCount === 0)
    },
    {
      key: 'zero-sales',
      title: '销量为 0',
      description: '店铺站点没有销量事实，需要确认销量导入或 provider 状态。',
      rows: rows.filter((row) => row.salesFactRows === 0)
    },
    {
      key: 'product-without-sales',
      title: '有商品无销量',
      description: '商品经营面存在，但没有任何商品匹配到销量事实。',
      rows: rows.filter((row) => row.siteOfferCount > 0 && row.offersWithSalesFacts === 0)
    },
    {
      key: 'sales-without-product',
      title: '有销量无商品',
      description: '销量事实存在，但系统商品经营面缺失或映射失败。',
      rows: rows.filter((row) => row.siteOfferCount === 0 && row.salesProductKeyCount > 0)
    }
  ]
}

function sortByIssue(rows: StoreReportRowView[], score: (row: StoreReportRowView) => number) {
  return [...rows].sort((first, second) => score(second) - score(first) || second.siteOfferCount - first.siteOfferCount)
}

function rowDetailFieldMissing(row: StoreDataReportRow) {
  return (
    row.missingTitleEnCount +
    row.missingDescriptionEnCount +
    row.missingBrandCount +
    row.missingProductFulltypeCount +
    row.missingImageCount
  )
}

function sum(rows: StoreReportRowView[], pick: (row: StoreReportRowView) => number) {
  return rows.reduce((total, row) => total + pick(row), 0)
}
