import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const featureSource = [
  'SalesAnalyticsPage.tsx',
  'components/SalesAnalyticsWorkbench.tsx',
  'components/ProductDetailDialog.tsx',
  'presentation/productColumns.tsx',
  'presentation/statusPresentation.tsx'
].map((fileName) => readFileSync(
  join(process.cwd(), 'src/features/sales-analytics', fileName),
  'utf8'
)).join('\n')

const dataPullBoundarySource = [
  'types.ts',
  'api.ts',
  'hooks/useSalesAnalyticsDataset.ts',
  'hooks/useSalesProductDetail.ts',
  'components/SalesAnalyticsWorkbench.tsx',
  'components/ProductDetailDialog.tsx',
  'presentation/statusPresentation.tsx',
  'presentation/formatters.tsx'
].map((fileName) => readFileSync(
  join(process.cwd(), 'src/features/sales-analytics', fileName),
  'utf8'
)).join('\n')

assert.doesNotMatch(
  featureSource,
  /sales-lifecycle-filter|lifecycleFilterOptions|lifecycleColor|lifecycleQualityLabel/,
  '已退役的商品生命周期不得继续作为销量分析的筛选、标签或健康度暴露'
)
assert.doesNotMatch(
  featureSource,
  /productColumnHelp\.inTransit|key:\s*'inTransit'|在途\s*—|未接入字段/,
  '底层数据未接入的在途字段不得作为正式列或占位指标暴露'
)
assert.doesNotMatch(
  dataPullBoundarySource,
  /syncStatus|businessMetricsAvailable|historyCoverage|history-backfill|sales_fact_ready|销量就绪|经营正常|补拉当前范围/,
  '销量分析不得消费 DP readiness/completeness/coverage，也不得保留无任务来源的手工补拉死路'
)
