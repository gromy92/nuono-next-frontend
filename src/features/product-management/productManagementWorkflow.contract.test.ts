import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

function source(fileName: string) {
  return readFileSync(new URL(fileName, import.meta.url), 'utf8')
}

const filterBarSource = source('./components/ProductCatalogFilterBar.tsx')
const tablePanelSource = source('./components/ProductCatalogTablePanel.tsx')
const identityCellSource = source('./components/ProductListIdentityCells.tsx')
const moreOperationsSource = source('./components/ProductListMoreOperations.tsx')
const workspaceSurfaceSource = source('./workspaceSurfaces.ts')
const listFilterSource = source('./utils/productListFilters.ts')

assert.match(filterBarSource, /高级筛选/)
assert.match(filterBarSource, /productListAdvancedFiltersOpen/)
assert.match(filterBarSource, /data-testid="product-advanced-filters"/)
assert.match(workspaceSurfaceSource, /productListAdvancedFiltersOpen/)
assert.match(workspaceSurfaceSource, /setProductListAdvancedFiltersOpen/)

assert.match(listFilterSource, /syncFilter === 'attention'/)
assert.match(listFilterSource, /label: '待处理'/)
assert.match(tablePanelSource, /aria-pressed/)

assert.match(identityCellSource, /primaryActionLabel/)
assert.match(identityCellSource, /'处理失败'/)
assert.match(identityCellSource, /'继续编辑'/)
assert.match(identityCellSource, /<ProductListMoreOperations/)
assert.match(moreOperationsSource, /title="更多操作"/)
assert.match(moreOperationsSource, /<ProductDeleteAction/)
assert.match(moreOperationsSource, /重建商品/)

const moreOperationsIndex = moreOperationsSource.indexOf('title="更多操作"')
assert.ok(moreOperationsIndex >= 0)
assert.ok(
  moreOperationsSource.indexOf('<ProductDeleteAction', moreOperationsIndex) > moreOperationsIndex,
  '删除必须位于更多操作容器内，不能与查看详情同层'
)
