import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const productManagementDir = dirname(fileURLToPath(import.meta.url))

function source(path: string) {
  return readFileSync(join(productManagementDir, path), 'utf8')
}

const filterBarSource = source('./components/ProductCatalogFilterBar.tsx')
const drawerSource = source('./components/ProductListingDraftDrawer.tsx')
const listingPageSource = source('../product-listing/ProductListingPage.tsx')

assert.match(
  filterBarSource,
  /ProductListingDraftDrawer/,
  '商品列表工具栏必须提供上架草稿入口'
)

assert.match(
  drawerSource,
  /fetchProductListingDrafts/,
  '上架草稿入口必须从后端读取当前店铺草稿'
)

assert.match(
  drawerSource,
  /saveProductListingDraftRecoveryPrefill/,
  '继续编辑草稿时必须把草稿内容写入上架页 prefill'
)

assert.match(
  drawerSource,
  /listingSource['"]?\s*,\s*['"]listing-draft|listingSource:\s*['"]listing-draft/,
  '继续编辑草稿时必须跳转到 listing-draft 来源的上架页'
)

assert.doesNotMatch(
  drawerSource,
  /<Table<ProductListingDraftView>/,
  '上架草稿抽屉不应使用表格列布局，长来源和按钮会被窄列挤成逐字竖排'
)

assert.match(
  drawerSource,
  /<List<ProductListingDraftView>/,
  '上架草稿抽屉应使用列表卡片布局承载长标题、来源和操作按钮'
)

assert.match(
  drawerSource,
  /className="product-listing-draft-card"/,
  '上架草稿列表项必须有稳定卡片容器，避免内容横向挤压'
)

assert.match(
  drawerSource,
  /minWidth:\s*0/,
  '上架草稿标题区域必须允许 ellipsis 收缩，而不是挤压来源列'
)

assert.match(
  drawerSource,
  /whiteSpace:\s*'nowrap'/,
  '上架草稿来源字段必须禁止逐字换行'
)

assert.match(
  drawerSource,
  /flexShrink:\s*0/,
  '上架草稿继续编辑按钮不能被列表内容挤压'
)

assert(
  listingPageSource.includes('${PRODUCT_WORKSPACE_PATH}?listingDrafts=1') &&
    drawerSource.includes("search.get('listingDrafts') !== '1'") &&
    drawerSource.includes('void loadDrafts()'),
  '上架来源门禁的查看草稿按钮必须落到商品列表并自动打开草稿抽屉'
)
