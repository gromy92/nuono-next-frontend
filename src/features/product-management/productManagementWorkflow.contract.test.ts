import assert from 'node:assert/strict'
import { countActiveProductListAdvancedFilters } from './components/ProductCatalogFilterBar'
import { productListPrimaryActionLabel } from './components/ProductListIdentityCells'
import type { ProductListFilters } from './types'
import { buildProductListShellHighlights } from './utils/productListFilters'

const defaultFilters: ProductListFilters = {
  skuQuery: '',
  titleQuery: '',
  brandQuery: '',
  issueFilter: 'all',
  liveFilter: 'all',
  syncFilter: 'all',
  stockFilter: 'all',
  operationStageFilter: 'all'
}

assert.equal(countActiveProductListAdvancedFilters(defaultFilters, 'lastSync'), 0)
assert.equal(
  countActiveProductListAdvancedFilters({
    ...defaultFilters,
    brandQuery: 'PAPERSAY',
    liveFilter: 'offline',
    issueFilter: 'content',
    stockFilter: 'fbn',
    operationStageFilter: 'growth'
  }, 'price'),
  6,
  '高级筛选计数必须覆盖品牌、上架状态、问题、库存、运营阶段和排序'
)

assert.equal(productListPrimaryActionLabel('failed'), '处理失败')
assert.equal(productListPrimaryActionLabel('draft'), '继续编辑')
assert.equal(productListPrimaryActionLabel('conflict'), '继续编辑')
assert.equal(productListPrimaryActionLabel('synced'), '查看详情')

assert.deepEqual(
  buildProductListShellHighlights(Array.from({ length: 13 }, () => ({} as never)), {
    synced: 7,
    draft: 2,
    conflict: 1,
    failed: 3
  }).map(({ label, value, syncFilter }) => ({ label, value, syncFilter })),
  [
    { label: '全部', value: 13, syncFilter: 'all' },
    { label: '待处理', value: 6, syncFilter: 'attention' },
    { label: '本地草稿', value: 3, syncFilter: 'draft' },
    { label: '发布失败', value: 3, syncFilter: 'failed' },
    { label: '已同步', value: 7, syncFilter: 'synced' }
  ]
)
