import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ShippingBatchDiagnosticAlert } from './ShippingBatchDiagnosticAlert'
import { diagnoseOfficialWarehouseShippingBatch } from './officialWarehouseApiClient'
import {
  isOfficialWarehouseShippingBatchSelectable,
  shippingBatchDiagnosticEmptyText,
  zeroQuantityShippingBatchDiagnostic
} from './shippingBatchDiagnosticPresentation'

const diagnostic = {
  code: 'NO_PRODUCT_DETAILS',
  severity: 'warning' as const,
  title: '物流批次缺少商品明细',
  message: '批次 ZDAIR8111341 已同步 3 个箱子，但没有商品明细。',
  action: '补充装箱单商品明细后重新查询',
  batchNo: 'ZDAIR8111341',
  packageCount: 3
}

const markup = renderToStaticMarkup(createElement(ShippingBatchDiagnosticAlert, { diagnostic }))

assert.match(markup, /物流批次缺少商品明细/)
assert.match(markup, /ZDAIR8111341/)
assert.match(markup, /补充装箱单商品明细后重新查询/)
assert.equal(shippingBatchDiagnosticEmptyText(undefined, false), '未找到可约仓物流批次')
assert.equal(shippingBatchDiagnosticEmptyText(diagnostic, false), '未找到可选择的物流批次，请查看上方原因')
assert.equal(shippingBatchDiagnosticEmptyText(undefined, true), '正在查询物流批次…')
assert.equal(isOfficialWarehouseShippingBatchSelectable({
  id: '1', batchNo: 'NO-QTY', status: 'in_transit', remainingQuantity: 0
}), false)
assert.equal(isOfficialWarehouseShippingBatchSelectable({
  id: '2', batchNo: 'REUSABLE', status: 'warehouse_received', remainingQuantity: 0, alreadyAppointed: true
}), true)
assert.equal(zeroQuantityShippingBatchDiagnostic([{
  id: '1', batchNo: 'NO-QTY', status: 'in_transit', remainingQuantity: 0
}])?.code, 'NO_AVAILABLE_QUANTITY')

const originalFetch = globalThis.fetch
let requestedUrl = ''
globalThis.fetch = (async (input) => {
  requestedUrl = String(input)
  return new Response(JSON.stringify(diagnostic), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}) as typeof fetch
try {
  const response = await diagnoseOfficialWarehouseShippingBatch({
    storeCode: 'STR69486-NSA',
    siteCode: 'SA',
    keyword: 'ZDAIR8111341'
  })
  assert.equal(response.code, 'NO_PRODUCT_DETAILS')
  assert.match(requestedUrl, /\/api\/warehouse\/official-warehouse\/shipping-batches\/diagnostic\?/)
  assert.match(requestedUrl, /storeCode=STR69486-NSA/)
  assert.match(requestedUrl, /siteCode=SA/)
  assert.match(requestedUrl, /keyword=ZDAIR8111341/)
} finally {
  globalThis.fetch = originalFetch
}
