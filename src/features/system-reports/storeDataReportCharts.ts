import type { EChartsCoreOption } from 'echarts/core'
import {
  buildStoreDataReportProjection,
  rankStoreRows,
  rankingColor,
  rankingDimensionLabel
} from './reportBlocks'
import type { RankingDimension, StoreReportRowView } from './reportBlocks'
import type { StoreDataReportOverview } from './types'

export function buildChartOptions(
  rows: StoreReportRowView[],
  totals: ReturnType<typeof buildStoreDataReportProjection>['totals'],
  rankingDimension: RankingDimension,
  rankingLimit: number
) {
  const rankingRows = rankStoreRows(rows, rankingDimension, rankingLimit).reverse()
  const detailFieldItems = [
    { name: '标题缺失', value: sumRows(rows, (row) => row.missingTitleEnCount) },
    { name: '描述缺失', value: sumRows(rows, (row) => row.missingDescriptionEnCount) },
    { name: '品牌缺失', value: sumRows(rows, (row) => row.missingBrandCount) },
    { name: '类目缺失', value: sumRows(rows, (row) => row.missingProductFulltypeCount) },
    { name: '图片缺失', value: sumRows(rows, (row) => row.missingImageCount) }
  ]
  const emptyStoreItems = [
    { name: '商品为 0', value: totals.emptyStoreSites },
    { name: '销量为 0', value: rows.filter((row) => row.salesFactRows === 0).length },
    { name: '有商品无销量', value: totals.productWithoutSalesSites },
    { name: '有销量无商品', value: totals.salesWithoutProductSites }
  ]
  return {
    completeness: baseChartOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { bottom: 0 },
      grid: { top: 20, left: 8, right: 8, bottom: 44, containLabel: true },
      xAxis: { type: 'category', data: ['详情字段', '销量事实', '生命周期'] },
      yAxis: { type: 'value', minInterval: 1 },
      series: [
        {
          name: '已覆盖',
          type: 'bar',
          stack: 'coverage',
          data: [
            Math.max(totals.siteOffers * 5 - totals.detailFieldMissing, 0),
            totals.offersWithSalesFacts,
            totals.lifecycleCurrent
          ],
          itemStyle: { color: '#2563eb', borderRadius: [4, 4, 0, 0] }
        },
        {
          name: '缺失',
          type: 'bar',
          stack: 'coverage',
          data: [totals.detailFieldMissing, totals.offersWithoutSalesFacts, totals.lifecycleMissing],
          itemStyle: { color: '#f97316', borderRadius: [4, 4, 0, 0] }
        }
      ]
    }),
    storeRanking: baseChartOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { top: 8, left: 8, right: 24, bottom: 12, containLabel: true },
      xAxis: { type: 'value', minInterval: 1 },
      yAxis: {
        type: 'category',
        data: rankingRows.map((row) => `${row.displayName} / ${row.siteCode}\n${row.storeCode}`),
        axisLabel: { fontSize: 11 }
      },
      series: [
        {
          name: rankingDimensionLabel(rankingDimension),
          type: 'bar',
          data: rankingRows.map((row) => row.rankingValue),
          label: { show: true, position: 'right' },
          itemStyle: { color: rankingColor(rankingDimension), borderRadius: [0, 4, 4, 0] }
        }
      ]
    }),
    issueMix: pieOption('异常构成', [
      { name: '详情基线缺失', value: totals.missingDetailBaseline },
      { name: '详情字段缺失', value: totals.detailFieldMissing },
      { name: '销量事实缺失', value: totals.offersWithoutSalesFacts },
      { name: '销量映射异常', value: totals.salesMappingAnomalies },
      { name: '生命周期缺失', value: totals.lifecycleMissing },
      { name: '生命周期数据不足', value: totals.lifecycleDataInsufficient },
      { name: '跨店铺挂载', value: totals.crossStoreOffers }
    ], '46%', '72%'),
    detailFieldMix: pieOption('字段缺失', detailFieldItems),
    detailTop: buildTopStoreBarOption(rows, (row) => row.detailFieldMissingTotal, '字段缺失', '#16a34a'),
    salesCoverage: coverageBarOption(
      '商品销量覆盖',
      [
        { name: '有销量商品', value: totals.offersWithSalesFacts, color: '#2563eb' },
        { name: '缺销量商品', value: totals.offersWithoutSalesFacts, color: '#f97316' }
      ],
      'sales-coverage'
    ),
    salesTop: buildTopStoreBarOption(rows, (row) => row.offersWithoutSalesFacts, '缺销量商品', '#f97316'),
    mappingMix: pieOption('映射异常', [
      { name: '销量无商品', value: totals.salesMappingAnomalies },
      { name: '跨店铺挂载', value: totals.crossStoreOffers },
      { name: '商品无销量', value: totals.offersWithoutSalesFacts }
    ]),
    mappingTop: buildTopStoreBarOption(
      rows,
      (row) => row.mappingAnomalyTotal + row.offersWithoutSalesFacts,
      '映射/覆盖问题',
      '#7c3aed'
    ),
    lifecycleCoverage: coverageBarOption(
      '生命周期计算',
      [
        { name: '已计算', value: totals.lifecycleCurrent, color: '#2563eb' },
        { name: '未计算', value: totals.lifecycleMissing, color: '#ef4444' },
        { name: '数据不足', value: totals.lifecycleDataInsufficient, color: '#f97316', stacked: false }
      ],
      'lifecycle-coverage'
    ),
    lifecycleTop: buildTopStoreBarOption(
      rows,
      (row) => row.lifecycleMissingCount + row.lifecycleDataInsufficientCount,
      '生命周期问题',
      '#ef4444'
    ),
    emptyStore: baseChartOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { top: 16, left: 8, right: 8, bottom: 12, containLabel: true },
      xAxis: { type: 'value', minInterval: 1 },
      yAxis: {
        type: 'category',
        data: emptyStoreItems.map((item) => item.name).reverse(),
        axisLabel: { fontSize: 11 }
      },
      series: [{
        name: '店铺站点数',
        type: 'bar',
        data: emptyStoreItems.map((item) => item.value).reverse(),
        label: { show: true, position: 'right' },
        itemStyle: { color: '#0891b2', borderRadius: [0, 4, 4, 0] }
      }]
    })
  }
}

export function buildStoreOptions(rows: StoreDataReportOverview['rows']) {
  const optionMap = new Map<string, { value: string; label: string }>()
  for (const row of rows) {
    if (!row.storeCode || optionMap.has(row.storeCode)) continue
    optionMap.set(row.storeCode, {
      value: row.storeCode,
      label: `${row.projectName || row.projectCode || row.storeCode} / ${row.siteCode || '-'} / ${row.storeCode}`
    })
  }
  return Array.from(optionMap.values()).sort((first, second) => first.label.localeCompare(second.label))
}

function pieOption(
  name: string,
  items: Array<{ name: string; value: number }>,
  innerRadius = '42%',
  outerRadius = '70%'
) {
  return baseChartOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, type: 'scroll' },
    series: [{
      name,
      type: 'pie',
      radius: [innerRadius, outerRadius],
      center: ['50%', name === '异常构成' ? '44%' : '42%'],
      itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
      label: { formatter: '{b}: {c}' },
      data: issueMixData(items)
    }]
  })
}

function coverageBarOption(
  category: string,
  items: Array<{ name: string; value: number; color: string; stacked?: boolean }>,
  stack: string
) {
  return baseChartOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { bottom: 0 },
    grid: { top: 24, left: 8, right: 8, bottom: 44, containLabel: true },
    xAxis: { type: 'category', data: [category] },
    yAxis: { type: 'value', minInterval: 1 },
    series: items.map((item) => ({
      name: item.name,
      type: 'bar',
      ...(item.stacked === false ? {} : { stack }),
      data: [item.value],
      itemStyle: { color: item.color, borderRadius: item.stacked === false ? [4, 4, 4, 4] : [4, 4, 0, 0] }
    }))
  })
}

function buildTopStoreBarOption(
  rows: StoreReportRowView[],
  score: (row: StoreReportRowView) => number,
  seriesName: string,
  color: string
): EChartsCoreOption {
  const rankedRows = rows
    .map((row) => ({ label: `${row.displayName} / ${row.siteCode}\n${row.storeCode}`, value: score(row) }))
    .filter((row) => row.value > 0)
    .sort((first, second) => second.value - first.value)
    .slice(0, 10)
    .reverse()
  const chartRows = rankedRows.length > 0 ? rankedRows : [{ label: '暂无问题', value: 0 }]
  return baseChartOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { top: 8, left: 8, right: 24, bottom: 12, containLabel: true },
    xAxis: { type: 'value', minInterval: 1 },
    yAxis: { type: 'category', data: chartRows.map((row) => row.label), axisLabel: { fontSize: 11 } },
    series: [{
      name: seriesName,
      type: 'bar',
      data: chartRows.map((row) => row.value),
      label: { show: true, position: 'right' },
      itemStyle: { color, borderRadius: [0, 4, 4, 0] }
    }]
  })
}

function baseChartOption(option: EChartsCoreOption): EChartsCoreOption {
  return {
    color: ['#2563eb', '#f97316', '#ef4444', '#16a34a', '#7c3aed', '#0891b2'],
    textStyle: {
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif'
    },
    ...option
  }
}

function issueMixData(items: Array<{ name: string; value: number }>) {
  const nonZeroItems = items.filter((item) => item.value > 0)
  return nonZeroItems.length > 0 ? nonZeroItems : [{ name: '暂无异常', value: 1, itemStyle: { color: '#94a3b8' } }]
}

function sumRows(rows: StoreReportRowView[], pick: (row: StoreReportRowView) => number) {
  return rows.reduce((total, row) => total + pick(row), 0)
}
