import { strict as assert } from 'node:assert'
import {
  officialWarehouseApiContractSource,
  officialWarehousePageContractSource
} from './officialWarehouseContractSources'

const apiSource = officialWarehouseApiContractSource
const pageSource = officialWarehousePageContractSource

assert.match(
  apiSource,
  /shipping-batches\/product-summary/,
  'selected batches should load the read-only batch product summary endpoint'
)
assert.match(apiSource, /totalQuantity: number/, 'summary contract should expose whole-batch quantity')
assert.match(apiSource, /totalSkuCount: number/, 'summary contract should expose whole-batch SKU count')
assert.match(apiSource, /missingDimensionItems:/, 'summary contract should expose missing-dimension SKU details')
assert.match(apiSource, /otherStores:/, 'summary contract should expose other accessible store totals')

assert.match(pageSource, /title="整票商品"/, 'the page should label whole-batch quantity and SKU count')
assert.match(pageSource, /title=\{`当前店铺/, 'the page should label the selected store totals')
assert.match(pageSource, /title="当前店铺可约"/, 'the page should label bookable quantity and SKU count')
assert.match(
  pageSource,
  /缺尺寸：\$\{number\(current\.missingDimensionSkuCount/,
  'the page should show missing-dimension SKU and unit totals'
)
assert.match(
  pageSource,
  /item\.partnerSku[\s\S]*?item\.quantity[\s\S]*?item\.reasons/,
  'blocked rows should show the exact SKU, quantity and reason'
)
assert.match(
  pageSource,
  /别的店铺：\$\{summary\.otherStores\.length\} 家/,
  'the page should explicitly count other stores'
)
assert.match(
  pageSource,
  /store\.storeName[\s\S]*?store\.storeCode[\s\S]*?store\.siteCode[\s\S]*?store\.totalQuantity[\s\S]*?store\.totalSkuCount/,
  'each other store should show name, code, site, quantity and SKU count'
)
assert.match(
  pageSource,
  /未归属或无权查看/,
  'unattributed units should remain visible without leaking unauthorized stores'
)
assert.match(
  pageSource,
  /if \(!enabled \|\| !storeCode \|\| !siteCode \|\| !shippingBatchIds\.length\)/,
  'the summary hook should not request data before a batch is selected'
)
assert.match(
  pageSource,
  /requestId === requestIdRef\.current/,
  'stale summary responses should not replace the current selection'
)
assert.match(
  pageSource,
  /if \(batchSummaryBlocked\)[\s\S]*?汇总加载成功后再创建 ASN/,
  'ASN submission should stop while the selected-batch summary is unavailable'
)
assert.match(
  pageSource,
  /okButtonProps=\{\{ disabled: batchSummaryBlocked/,
  'the create button should visibly remain disabled until summary loading succeeds'
)
