import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const purchaseOrderDir = dirname(fileURLToPath(import.meta.url))
const pageSource = readFileSync(join(purchaseOrderDir, 'PurchaseOrderPage.tsx'), 'utf8')
const formsSource = readFileSync(join(purchaseOrderDir, 'components/PurchaseOrderForms.tsx'), 'utf8')
const createItemModalsSource = readFileSync(join(purchaseOrderDir, 'components/PurchaseOrderCreateItemModals.tsx'), 'utf8')
const sidebarSource = readFileSync(join(purchaseOrderDir, 'components/PurchaseOrderSidebar.tsx'), 'utf8')
const workbenchSource = readFileSync(join(purchaseOrderDir, 'components/PurchaseOrderWorkbench.tsx'), 'utf8')
const itemMutationsSource = readFileSync(join(purchaseOrderDir, 'hooks/usePurchaseOrderItemMutations.ts'), 'utf8')
const orderMutationsSource = readFileSync(join(purchaseOrderDir, 'hooks/usePurchaseOrderMutations.ts'), 'utf8')
const storeModelSource = readFileSync(join(purchaseOrderDir, 'model/purchaseOrderStoreModel.tsx'), 'utf8')
const uiMetaSource = readFileSync(join(purchaseOrderDir, 'model/purchaseOrderUiMeta.tsx'), 'utf8')
const purchaseOrderFeatureSource = [
  pageSource,
  formsSource,
  createItemModalsSource,
  sidebarSource,
  workbenchSource,
  itemMutationsSource,
  orderMutationsSource,
  storeModelSource,
  uiMetaSource
].join('\n')
const apiSource = [
  readFileSync(join(purchaseOrderDir, 'api.ts'), 'utf8'),
  readFileSync(join(purchaseOrderDir, 'purchaseOrderApiClient.ts'), 'utf8'),
  readFileSync(join(purchaseOrderDir, 'purchaseOrderRequests.ts'), 'utf8'),
  readFileSync(join(purchaseOrderDir, 'shippingOrderRequests.ts'), 'utf8')
].join('\n')

assert.doesNotMatch(
  purchaseOrderFeatureSource,
  /请至少添加一行 PSKU、站点和数量。/,
  'creating a purchase order must allow an empty PSKU row and create an empty order'
)

assert.doesNotMatch(
  purchaseOrderFeatureSource,
  /name=\{\[field\.name,\s*['"]psku['"]\]\}[\s\S]{0,180}rules=\{\[\{ required: true, whitespace: true, message: ['"]请输入 PSKU['"]/,
  'PSKU field validation must not block empty-order creation before submit'
)

assert.match(
  purchaseOrderFeatureSource,
  /siteCodes:\s*siteCodesFromPskuRows\(values\.items\)/,
  'empty-order creation must preserve the selected site scope from the raw form rows'
)

assert.match(
  purchaseOrderFeatureSource,
  /function siteCodesFromPskuRows\(rows\?: PskuEntryFormValue\[\]\)/,
  'purchase order creation must derive site scope from raw PSKU form rows'
)

assert.match(
  purchaseOrderFeatureSource,
  /async function handleAddItemsToOrder\(\)[\s\S]*请至少添加一行 PSKU、站点、运输方式和数量。/,
  'adding items to an existing purchase order must still require at least one valid item'
)

assert.match(
  purchaseOrderFeatureSource,
  /async function handleAddItemsToOrder\(\)[\s\S]*if \(!addItemsOrder\)[\s\S]*if \(isSubmittedOrder\(addItemsOrder\)\)[\s\S]*采购单已封存，不能再更改。[\s\S]*addPurchaseOrderItems\(addItemsOrder\.id/,
  'adding items must re-check submitted status before calling the API, even if the modal state is stale'
)

assert.match(
  purchaseOrderFeatureSource,
  /封存采购单/,
  'purchase order submission action must be presented as sealing the purchase order'
)

assert.match(
  purchaseOrderFeatureSource,
  /封存后采购单将锁定，不能继续修改商品、数量或站点运输；如需调整，请联系管理员处理。/,
  'sealing warning must clearly explain the lock and administrator path'
)

assert.match(
  purchaseOrderFeatureSource,
  /const \{[^}]*\bmodal\b[^}]*\}\s*=\s*AntdApp\.useApp\(\)/,
  'sealing confirmation must use the Ant Design App modal context instead of static Modal.confirm'
)

assert.match(
  purchaseOrderFeatureSource,
  /const \{[^}]*\bmessage:\s*appMessage\b[^}]*\}\s*=\s*AntdApp\.useApp\(\)/,
  'sealing warnings must use the Ant Design App message context instead of static message calls'
)

assert.match(
  purchaseOrderFeatureSource,
  /modal\.confirm\(\{/,
  'sealing confirmation must call the App modal confirm API so the dialog renders inside the shell'
)

assert.doesNotMatch(
  purchaseOrderFeatureSource,
  /Modal\.confirm\(\{/,
  'static Modal.confirm does not reliably render in the app shell'
)

assert.doesNotMatch(
  purchaseOrderFeatureSource,
  /disabled=\{!selectedOrder\.items\?\.length\}/,
  'empty purchase orders must still allow clicking seal so the user gets the empty-order warning'
)

assert.match(
  purchaseOrderFeatureSource,
  /function handleSubmitOrder\(order: PurchaseOrder\)[\s\S]*const issueSummary = summarizeOrderIssues\(order\)[\s\S]*hasSealBlockingIssues\(issueSummary\)[\s\S]*appMessage\.warning\('请先补齐采购单的站点运输和数量信息后再封存。'\)[\s\S]*modal\.confirm/,
  'sealing must pre-check known blocking item issues before opening the irreversible confirmation'
)

assert.doesNotMatch(
  purchaseOrderFeatureSource,
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
  purchaseOrderFeatureSource,
  /未封存不可合并/,
  'merge-disabled copy must say unsealed orders cannot merge'
)

assert.match(
  purchaseOrderFeatureSource,
  /多选合并为仓库单/,
  'multi-select merge entry must use warehouse-order wording'
)

assert.match(
  purchaseOrderFeatureSource,
  /formatOrderQuantitySummary\(selectedOrderSummary\)/,
  'top order summary must show PSKU count and total quantity through the compact formatter'
)

assert.match(
  purchaseOrderFeatureSource,
  /formatAllocationQuantitySummary\(allocation\)/,
  'site transport summary must show per-site transport PSKU count and total quantity'
)

assert.doesNotMatch(
  pageSource,
  /生成物流计划|整单采集|handlePreviewLogisticsPlan|handleGenerateLogisticsPlan|handleCollectOrder|LogisticsPlanContent|previewPurchaseOrderLogisticsPlan|generatePurchaseOrderLogisticsPlan|collectPurchaseOrder/,
  'purchase order page must remove logistics-plan generation and whole-order collection entry points'
)
