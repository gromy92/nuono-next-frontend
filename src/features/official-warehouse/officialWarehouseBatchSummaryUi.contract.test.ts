import { strict as assert } from 'node:assert'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { OfficialWarehouseBatchSummaryPanel } from './components/OfficialWarehouseBatchSummaryPanel'
import {
  isOfficialWarehouseBatchSummaryBlocked,
  type OfficialWarehouseBatchProductSummary
} from './officialWarehouseBatchSummaryTypes'

const summary: OfficialWarehouseBatchProductSummary = {
  totalQuantity: 3016,
  totalSkuCount: 64,
  totalLineCount: 71,
  currentStore: {
    storeCode: 'STR108065-NSA',
    storeName: 'Canman',
    siteCode: 'SA',
    totalQuantity: 2263,
    totalSkuCount: 42,
    bookableQuantity: 2223,
    bookableSkuCount: 41,
    blockedQuantity: 40,
    blockedSkuCount: 1,
    missingDimensionQuantity: 40,
    missingDimensionSkuCount: 1,
    blockedItems: [{
      partnerSku: 'PAPERSAYSB372',
      title: '缺尺寸商品',
      quantity: 40,
      reasons: ['缺尺寸']
    }],
    missingDimensionItems: [{
      partnerSku: 'PAPERSAYSB372',
      title: '缺尺寸商品',
      quantity: 40,
      reasons: ['缺尺寸']
    }]
  },
  otherStores: [{
    storeCode: 'STR69486-NSA',
    storeName: '另一家店',
    siteCode: 'SA',
    totalQuantity: 753,
    totalSkuCount: 22,
    blockedItems: [],
    missingDimensionItems: []
  }],
  unassignedQuantity: 0,
  unassignedSkuCount: 0,
  attributionWarning: false
}

const markup = renderToStaticMarkup(createElement(OfficialWarehouseBatchSummaryPanel, {
  selectedBatchCount: 1,
  summary,
  loading: false,
  onRetry: () => undefined
}))

assert.ok(
  markup.includes('official-warehouse-batch-summary-metrics'),
  'summary should render the compact metric row'
)
assert.ok(
  markup.includes('official-warehouse-batch-summary-store-list'),
  'other-store attribution should use the compact store list'
)
assert.ok(
  !markup.includes('ant-statistic'),
  'summary should not use oversized Statistic components'
)

for (const expected of [
  '所选物流批次商品汇总',
  '物流单原始 71 行，重复 SKU 已合并',
  '整票商品',
  '3,016',
  '64 SKU',
  '当前店铺 · Canman',
  '2,263',
  '42 SKU',
  '当前店铺可约',
  '2,223',
  '41 SKU',
  '缺尺寸：1 SKU / 40 件',
  'PAPERSAYSB372',
  '× 40 件',
  '别的店铺：1 家',
  '另一家店（STR69486-NSA / SA）',
  '753 件 / 22 SKU'
]) {
  assert.ok(markup.includes(expected), `summary should render ${expected}`)
}

assert.equal(
  isOfficialWarehouseBatchSummaryBlocked({
    selectedBatchCount: 0,
    loading: false
  }),
  false,
  'no selected batch should not block the create flow'
)
assert.equal(
  isOfficialWarehouseBatchSummaryBlocked({
    selectedBatchCount: 1,
    loading: true
  }),
  true,
  'loading should block ASN creation'
)
assert.equal(
  isOfficialWarehouseBatchSummaryBlocked({
    selectedBatchCount: 1,
    loading: false,
    error: '读取失败'
  }),
  true,
  'a summary error should block ASN creation'
)
assert.equal(
  isOfficialWarehouseBatchSummaryBlocked({
    selectedBatchCount: 1,
    loading: false
  }),
  true,
  'a missing summary should block ASN creation'
)
assert.equal(
  isOfficialWarehouseBatchSummaryBlocked({
    selectedBatchCount: 1,
    summary,
    loading: false
  }),
  false,
  'the current successful summary should allow ASN creation'
)
