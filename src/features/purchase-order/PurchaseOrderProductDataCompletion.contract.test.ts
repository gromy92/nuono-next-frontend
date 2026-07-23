import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'

const pageSource = readFileSync(new URL('./PurchaseOrderPage.tsx', import.meta.url), 'utf8')
const typesSource = readFileSync(new URL('./types.ts', import.meta.url), 'utf8')

assert.match(
  pageSource,
  /updatePurchaseOrderItemSourcingRequirement/,
  'purchase order product-data completion must save sourcing specs through the purchase-order sourcing requirement API'
)

assert.match(
  pageSource,
  /saveProductSpecSource\(\{[\s\S]*sourceType: 'ali1688'/,
  'purchase order product-data completion must save product specs to the 1688 source'
)

assert.doesNotMatch(
  pageSource,
  /selectProductSpecEffectiveSource/,
  'saving pre-application procurement specs must not mutate the global effective source'
)

assert.match(
  pageSource,
  /productDataSpecValuesFromDetail[\s\S]*findProductDataSpecSource\(detail\.sources, 'ali1688'\)/,
  'purchase order product-data completion must load the editable Web spec from the 1688 source'
)

assert.match(
  pageSource,
  /saveProductLogisticsProfile/,
  'purchase order product-data completion must save logistics attributes through the canonical product profile API'
)

assert.match(
  pageSource,
  /const \[productDataCompletionTarget, setProductDataCompletionTarget\]/,
  'purchase order page must keep one modal target for missing product data'
)

assert.match(
  pageSource,
  /title="补齐商品资料"[\s\S]*采购备注[\s\S]*1688 产品规格[\s\S]*箱规[\s\S]*商品属性/,
  'optional purchase notes, product specs, carton specs, and product attributes must be edited in one modal'
)

assert.match(
  typesSource,
  /cartonSpecComplete\?: boolean/,
  'purchase-order item contract must report carton completeness independently from product specs'
)

for (const requiredCartonField of ['cartonLengthCm', 'cartonWidthCm', 'cartonHeightCm', 'cartonWeightKg', 'cartonQuantity']) {
  assert.match(
    pageSource,
    new RegExp(`key: '${requiredCartonField}'`),
    `purchase order product-data completion must include ${requiredCartonField}`
  )
}

assert.match(
  pageSource,
  /sourceType: 'ali1688'[\s\S]*cartonSourceType: 'factory_carton'/,
  'purchase order carton specs must be saved to the 1688 factory-carton source'
)

assert.match(
  pageSource,
  /onIssueClick=\{\(issue\) => openProductDataCompletionModal\(selectedOrder, item, issue\)\}/,
  'clicking a product issue tag must open the unified product-data completion modal for that item'
)

assert.doesNotMatch(
  pageSource,
  /issues\.push\('规格缺失'\)/,
  'empty purchase-note text must not create a product specification issue'
)

assert.doesNotMatch(
  pageSource,
  /shouldRequireProductDataSourcing/,
  'purchase-note text must remain optional and must not participate in save validation'
)

assert.match(
  pageSource,
  /openFirstProductDataIssue\('产品规格缺失'\)/,
  'order-level 产品规格缺失 chip must route to the first missing product-spec item'
)

assert.match(
  pageSource,
  /openFirstProductDataIssue\('箱规缺失'\)/,
  'order-level 箱规缺失 chip must route to the first missing carton-spec item'
)

assert.match(
  pageSource,
  /openFirstProductDataIssue\('商品属性缺失'\)/,
  'order-level 商品属性缺失 chip must route to the first missing product-attribute item'
)

assert.match(
  pageSource,
  /箱规缺失仅提示，不阻塞本次封存/,
  'missing carton specs must be shown in the sealing confirmation without blocking sealing'
)

assert.match(
  pageSource,
  /PRODUCT_DATA_CARTON_SPEC_FIELDS\.map[\s\S]*validateProductDataNumberField\([\s\S]*field\.min,[\s\S]*false/,
  'carton fields must remain editable but optional in the unified modal'
)

assert.doesNotMatch(
  pageSource,
  /商品长宽高重和箱规/,
  'carton completeness must not be part of the product-spec blocking validation'
)

assert.match(
  pageSource,
  /loadAssignedShippingPurchaseOrderIds\(\)/,
  'shipping-order merge availability must use the dedicated assigned purchase-order endpoint'
)

assert.doesNotMatch(
  pageSource,
  /Promise\.all\(shippingOrders\.map/,
  'shipping-order merge availability must not scan a capped shipping-order list'
)
