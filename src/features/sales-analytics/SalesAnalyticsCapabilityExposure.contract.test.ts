import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const pageSource = readFileSync(
  join(process.cwd(), 'src/features/sales-analytics/SalesAnalyticsPage.tsx'),
  'utf8'
)

assert.doesNotMatch(
  pageSource,
  /sales-lifecycle-filter|lifecycleFilterOptions|lifecycleColor|lifecycleQualityLabel/,
  '已退役的商品生命周期不得继续作为销量分析的筛选、标签或健康度暴露'
)
assert.doesNotMatch(
  pageSource,
  /productColumnHelp\.inTransit|key:\s*'inTransit'|在途\s*—|未接入字段/,
  '底层数据未接入的在途字段不得作为正式列或占位指标暴露'
)
