import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const purchaseOrderDir = dirname(fileURLToPath(import.meta.url))
const pageSource = readFileSync(join(purchaseOrderDir, 'PurchaseOrderPage.tsx'), 'utf8')
const apiSource = readFileSync(join(purchaseOrderDir, 'api.ts'), 'utf8')

assert.doesNotMatch(
  pageSource,
  /请至少添加一行 PSKU、站点和数量。/,
  'creating a purchase order must allow an empty PSKU row and create an empty order'
)

assert.doesNotMatch(
  pageSource,
  /name=\{\[field\.name,\s*['"]psku['"]\]\}[\s\S]{0,180}rules=\{\[\{ required: true, whitespace: true, message: ['"]请输入 PSKU['"]/,
  'PSKU field validation must not block empty-order creation before submit'
)

assert.match(
  pageSource,
  /siteCodes:\s*siteCodesFromPskuRows\(values\.items\)/,
  'empty-order creation must preserve the selected site scope from the raw form rows'
)

assert.match(
  pageSource,
  /function siteCodesFromPskuRows\(rows\?: PskuEntryFormValue\[\]\)/,
  'purchase order creation must derive site scope from raw PSKU form rows'
)

assert.match(
  pageSource,
  /async function handleAddItemsToOrder\(\)[\s\S]*请至少添加一行 PSKU、站点、运输方式和数量。/,
  'adding items to an existing purchase order must still require at least one valid item'
)

assert.match(
  pageSource,
  /async function handleAddItemsToOrder\(\)[\s\S]*if \(!addItemsOrder\)[\s\S]*if \(isSubmittedOrder\(addItemsOrder\)\)[\s\S]*采购单已封存，不能再更改。[\s\S]*addPurchaseOrderItems\(addItemsOrder\.id/,
  'adding items must re-check submitted status before calling the API, even if the modal state is stale'
)

assert.match(
  pageSource,
  /封存采购单/,
  'purchase order submission action must be presented as sealing the purchase order'
)

assert.match(
  pageSource,
  /封存后采购单将锁定，不能继续修改商品、数量或站点运输；如需调整，请联系管理员处理。/,
  'sealing warning must clearly explain the lock and administrator path'
)

assert.match(
  pageSource,
  /const \{[^}]*\bmodal\b[^}]*\}\s*=\s*AntdApp\.useApp\(\)/,
  'sealing confirmation must use the Ant Design App modal context instead of static Modal.confirm'
)

assert.match(
  pageSource,
  /const \{[^}]*\bmessage:\s*appMessage\b[^}]*\}\s*=\s*AntdApp\.useApp\(\)/,
  'sealing warnings must use the Ant Design App message context instead of static message calls'
)

assert.match(
  pageSource,
  /modal\.confirm\(\{/,
  'sealing confirmation must call the App modal confirm API so the dialog renders inside the shell'
)

assert.doesNotMatch(
  pageSource,
  /Modal\.confirm\(\{/,
  'static Modal.confirm does not reliably render in the app shell'
)

assert.doesNotMatch(
  pageSource,
  /disabled=\{!selectedOrder\.items\?\.length\}/,
  'empty purchase orders must still allow clicking seal so the user gets the empty-order warning'
)

assert.match(
  pageSource,
  /function handleSubmitOrder\(order: PurchaseOrder\)[\s\S]*const issueSummary = summarizeOrderIssues\(order\)[\s\S]*hasSealBlockingIssues\(issueSummary\)[\s\S]*appMessage\.warning\('请先补齐采购单的站点运输和数量信息后再封存。'\)[\s\S]*modal\.confirm/,
  'sealing must pre-check known blocking item issues before opening the irreversible confirmation'
)

assert.doesNotMatch(
  pageSource,
  /提交采购单|已提交|未提交不可合并|多选合并发货单/,
  'purchase order UI must not use the old submit/unsubmitted/shipping-merge wording'
)

assert.doesNotMatch(
  apiSource,
  /提交采购单失败/,
  'purchase order submit API fallback copy must also use sealing wording'
)

assert.match(
  apiSource,
  /封存采购单失败/,
  'purchase order submit API fallback copy must say sealing failed'
)

assert.match(
  pageSource,
  /未封存不可合并/,
  'merge-disabled copy must say unsealed orders cannot merge'
)

assert.match(
  pageSource,
  /多选合并为仓库单/,
  'multi-select merge entry must use warehouse-order wording'
)

assert.match(
  pageSource,
  /formatOrderQuantitySummary\(selectedOrderSummary\)/,
  'top order summary must show PSKU count and total quantity through the compact formatter'
)

assert.match(
  pageSource,
  /formatAllocationQuantitySummary\(allocation\)/,
  'site transport summary must show per-site transport PSKU count and total quantity'
)

assert.doesNotMatch(
  pageSource,
  /生成物流计划|整单采集|handlePreviewLogisticsPlan|handleGenerateLogisticsPlan|handleCollectOrder|LogisticsPlanContent|previewPurchaseOrderLogisticsPlan|generatePurchaseOrderLogisticsPlan|collectPurchaseOrder/,
  'purchase order page must remove logistics-plan generation and whole-order collection entry points'
)
